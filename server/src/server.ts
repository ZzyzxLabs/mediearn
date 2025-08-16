import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { WalrusClient, TESTNET_WALRUS_PACKAGE_CONFIG, WalrusFile } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromB64 } from '@mysten/sui/utils';
import dotenv from 'dotenv';
import { BlobInfo, BlobStorage } from './blobStorage';

// Load environment variables
dotenv.config();

// Helper function to process blob content and extract actual data
function processBlobContent(rawBlob: Uint8Array, expectedSize?: number): string {
    console.log('🔍 Processing blob of length:', rawBlob.length);
    
    if (expectedSize && expectedSize > 0) {
        console.log('🔍 Expected content size:', expectedSize);
        
        // Simply extract the first N bytes where N is the expected content size
        // The actual content should be at the beginning of the blob
        const actualContent = rawBlob.slice(0, expectedSize);
        
        console.log(`🔍 Extracting first ${expectedSize} bytes from blob`);
        
        // Decode as UTF-8
        try {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const decodedString = decoder.decode(actualContent);
            
            // Clean up any remaining artifacts
            const cleanedString = decodedString
                .replace(/\0/g, '') // Remove null characters
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .trim();
            
            console.log('🔍 Extracted content:', cleanedString.substring(0, 100) + '...');
            return cleanedString;
            
        } catch (error) {
            console.warn('UTF-8 decode failed for extracted content');
        }
    }
    
    // Fallback: try to decode the entire blob as UTF-8
    try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const decodedString = decoder.decode(rawBlob);
        
        // Clean up the decoded string
        const cleanedString = decodedString
            .replace(/\0/g, '') // Remove null characters
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        if (cleanedString.length > 50) {
            console.log('🔍 Using fallback decoded string:', cleanedString.substring(0, 100) + '...');
            return cleanedString;
        }
        
    } catch (error) {
        console.warn('UTF-8 decode failed');
    }

    // If all else fails, return the first 100 bytes as hex for debugging
    console.warn('Could not extract readable content, returning hex');
    return Array.from(rawBlob.slice(0, Math.min(100, rawBlob.length))).map(b => b.toString(16).padStart(2, '0')).join('');
}





const blobStorage = new BlobStorage();

const app = express();
const PORT = process.env.PORT || 3000;

// Get Sui Private Key and Public Key from environment variables
const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;
const SUI_PUBLIC_KEY = process.env.SUI_PUBLIC_KEY;

// Create keypair from private key (trying different keypair types)
function createSuiKeypair(privateKeyString: string): Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair | null {
    try {
        console.log('🔍 Creating keypair from private key...');
        console.log(`📝 Private key format: ${privateKeyString.substring(0, 10)}...${privateKeyString.substring(privateKeyString.length - 10)}`);
        console.log(`📏 Private key length: ${privateKeyString.length}`);

        let keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;

        // Try different keypair types
        try {
            console.log('🔧 Trying Ed25519...');
            keypair = Ed25519Keypair.fromSecretKey(privateKeyString);
            console.log('✅ Ed25519 keypair created');
        } catch (ed25519Error) {
            try {
                console.log('🔧 Trying Secp256k1...');
                keypair = Secp256k1Keypair.fromSecretKey(privateKeyString);
                console.log('✅ Secp256k1 keypair created');
            } catch (secp256k1Error) {
                try {
                    console.log('🔧 Trying Secp256r1...');
                    keypair = Secp256r1Keypair.fromSecretKey(privateKeyString);
                    console.log('✅ Secp256r1 keypair created');
                } catch (secp256r1Error) {
                    throw new Error('Failed to create keypair with any type');
                }
            }
        }

        // console log the public key
        console.log(`📝 Public key: ${keypair.toSuiAddress()}`);

        console.log(`✅ Keypair created successfully, derived address: ${keypair.toSuiAddress()}`);
        return keypair;
    } catch (error) {
        console.error('❌ Error creating Sui keypair:', error);
        return null;
    }
}

// Initialize Sui client for testnet
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// Initialize Walrus client with testnet configuration and Sui client
const walrusClient = new WalrusClient({
    suiClient,
    network: 'testnet',
});

// Create Sui keypair
if (!SUI_PRIVATE_KEY || !SUI_PUBLIC_KEY) {
    console.log('❌ Both SUI_PRIVATE_KEY and SUI_PUBLIC_KEY environment variables must be set - Walrus uploads will fail');
    console.log('📝 Please add both to your .env file');
}

const keypair = SUI_PRIVATE_KEY ? createSuiKeypair(SUI_PRIVATE_KEY) : null;

if (keypair) {
    console.log('✅ Sui keypair created successfully');
    console.log(`📍 Public Key: ${SUI_PUBLIC_KEY}`);

    // Verify the public key matches
    const derivedPublicKey = keypair.toSuiAddress();
    if (derivedPublicKey !== SUI_PUBLIC_KEY) {
        console.log(`⚠️ Warning: Derived public key (${derivedPublicKey}) doesn't match provided public key (${SUI_PUBLIC_KEY})`);
        console.log('This might cause issues with Walrus operations');
    }
} else {
    console.log('❌ Failed to create Sui keypair - Walrus uploads will fail');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes

// Upload content to Walrus and store blob info
app.post('/api/upload', async (req, res) => {
    try {
        const { title, content, isPublic = true, ownerAddress } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Both title and content are required' });
        }

        if (!ownerAddress) {
            return res.status(400).json({ error: 'ownerAddress is required' });
        }

        // Upload to Walrus
        if (!keypair) {
            throw new Error('Private key not properly configured - cannot upload to Walrus');
        }

        console.log('Uploading to Walrus...');
        const fileBuffer = new Uint8Array(Buffer.from(content, 'utf8'));
        const fileSize = fileBuffer.byteLength;

        // Check WAL balance first
        try {
            const walletAddress = ownerAddress;
            console.log('🔍 Checking WAL token balance...');
            console.log(`📍 Wallet Address: ${walletAddress}`);
            console.log(`🌐 Network: testnet`);
            console.log(`🪙 WAL Token Contract: 0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`);

            const coins = await suiClient.getCoins({
                owner: walletAddress,
                coinType: '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL'
            });

            console.log(`📊 Raw coins response:`, JSON.stringify(coins, null, 2));

            const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
            console.log(`💰 Current WAL Balance: ${totalBalance} WAL`);

            if (totalBalance === BigInt(0)) {
                console.log('❌ No WAL tokens found. You need to get WAL tokens first.');
                console.log('💡 Try: https://suiexplorer.com/faucet or swap SUI for WAL on testnet');
            }
        } catch (balanceError) {
            console.log('⚠️ Could not check WAL balance:', balanceError);
        }

        let blobInfo: BlobInfo;

        try {
            // Create preview text for local storage
            const firstParagraph = content.split('\n\n')[0] || content.substring(0, 200);
            const previewText = `${title}\n\n${firstParagraph}`;

            let contentBlobId: string;

            console.log('🔄 Uploading content to Walrus...');

            try {
                console.log('🔄 Uploading article content to Walrus using writeFiles...');

                // Log storage requirements
                const totalBytes = fileBuffer.byteLength;
                const epochs = 1; // Set to 1 to make storage as cheap as possible
                console.log(`📊 Storage Requirements:`);
                console.log(`   - Article content: ${totalBytes} bytes`);
                console.log(`   - Storage duration: ${epochs} epochs`);
                console.log(`   - Estimated WAL cost: ${totalBytes * epochs / 1000000} WAL (rough estimate)`);

                // Create WalrusFile object for the entire article content
                const contentFile = WalrusFile.from({
                    contents: fileBuffer,
                    identifier: `article-${title}-${Date.now()}`,
                    tags: {
                        'type': 'article',
                        'title': title
                    }
                });

                const results = await walrusClient.writeFiles({
                    files: [contentFile],
                    deletable: true,
                    epochs: 1, // Set to 1 to make storage as cheap as possible
                    signer: keypair as any
                });

                // Handle the results array properly
                const contentResult = Array.isArray(results) ? results[0] : results;

                console.log('✅ Article content uploaded successfully to Walrus:', contentResult);

                // Extract blob ID from the result
                if (!contentResult?.blobId) {
                    throw new Error('Walrus upload failed: Missing blob ID from response');
                }

                contentBlobId = contentResult.blobId;

                console.log('🔍 Extracted blob ID:', contentBlobId);

            } catch (writeError) {
                console.error('⚠️ writeFiles failed with error:', writeError);
                throw new Error(`Walrus upload failed: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
            }

            // Create blob info with preview text stored locally and content blob ID from Walrus
            blobInfo = blobStorage.createBlob({
                title: title,
                originalFileSize: content.length, // Store the actual content size, not file size
                ownerAddress: ownerAddress,
                isPublic: req.body.isPublic !== 'false', // Default to public unless explicitly set to false
                previewText: previewText, // Store preview text locally
                walrus: {
                    contentBlob: {
                        blobId: contentBlobId,
                        storageEpochs: 1,
                        isCertified: true,
                        uploadStatus: 'success',
                        uploadDate: new Date().toISOString()
                    },
                    overallStatus: 'success'
                }
            });

        } catch (walrusError) {
            console.error('❌ Walrus upload failed:', walrusError);

            // Return error response instead of creating local blob
            return res.status(500).json({
                success: false,
                error: 'Walrus upload failed',
                message: 'Failed to upload content to decentralized storage',
                details: walrusError instanceof Error ? walrusError.message : 'Unknown error'
            });
        }

        // Only reach here if Walrus upload was successful
        res.json({
            success: true,
            message: 'Article uploaded successfully to Walrus with local preview storage',
            blobInfo: blobInfo
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload content' });
    }
});



// Get all blobs (with full information)
app.get('/api/blobs', (req, res) => {
    try {
        const blobs = blobStorage.getAllBlobs();
        res.json(blobs);
    } catch (error) {
        console.error('Error reading blobs:', error);
        res.status(500).json({ error: 'Failed to fetch blobs' });
    }
});

// Get all blob previews from local storage
app.get('/api/blobs/preview', (req, res) => {
    try {
        const blobs = blobStorage.getAllBlobs().filter(blob => blob.previewText);

        if (blobs.length === 0) {
            return res.json([]);
        }

        // Return only preview text and blob ID for each blob
        const previewsWithContent = blobs.map((blob) => {
            return {
                blobId: blob.id,
                previewText: blob.previewText
            };
        });

        res.json(previewsWithContent);
    } catch (error) {
        console.error('Error reading blob previews:', error);
        res.status(500).json({ error: 'Failed to fetch blob previews' });
    }
});

// Get full content from Walrus by blob ID
app.get('/api/blobs/:id/content', async (req, res) => {
    try {
        const { id } = req.params;

        // Get blob info from local storage
        const blob = blobStorage.getBlob(id);

        if (!blob) {
            return res.status(404).json({ error: 'Blob not found' });
        }

        // Check if blob has content information
        if (!blob.walrus?.contentBlob?.blobId) {
            return res.status(404).json({ error: 'Content not available for this blob' });
        }

        try {
            // Fetch content from Walrus using readBlob
            if (!blob.walrus.contentBlob.blobId) {
                return res.status(404).json({ error: 'Content blob ID not available' });
            }

            const rawContent = await walrusClient.readBlob({ blobId: blob.walrus.contentBlob.blobId });
            console.log(`🔍 Raw content for blob ${id}:`, rawContent);

            // Process the blob to extract actual content using the stored content size
            const processedContent = processBlobContent(rawContent, blob.originalFileSize);
            console.log(`🔍 Processed content for blob ${id}:`, processedContent);

            res.json({
                blobId: id,
                title: blob.title,
                content: processedContent,
                metadata: {
                    uploadDate: blob.uploadDate,
                    ownerAddress: blob.ownerAddress,
                    isPublic: blob.isPublic,
                    originalFileSize: blob.originalFileSize
                }
            });
        } catch (walrusError) {
            console.error('Error fetching content from Walrus:', walrusError);
            res.status(500).json({
                error: 'Failed to fetch content from Walrus',
                details: walrusError instanceof Error ? walrusError.message : 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Error reading blob content:', error);
        res.status(500).json({ error: 'Failed to fetch blob content' });
    }
});

// Search blobs (must come before :id route)
app.get('/api/blobs/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const blobs = blobStorage.getAllBlobs().filter(blob =>
            blob.title.includes(q) || blob.ownerAddress.includes(q)
        );
        res.json(blobs);
    } catch (error) {
        console.error('Error searching blobs:', error);
        res.status(500).json({ error: 'Failed to search blobs' });
    }
});

// Get blobs by upload status
app.get('/api/blobs/status/:status', (req, res) => {
    try {
        const { status } = req.params;
        const blobs = blobStorage.getAllBlobs().filter(blob => blob.walrus?.overallStatus === status);
        res.json(blobs);
    } catch (error) {
        console.error('Error reading blobs by status:', error);
        res.status(500).json({ error: 'Failed to fetch blobs' });
    }
});

// Get blob by ID (must come after specific routes)
app.get('/api/blobs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const blob = blobStorage.getBlob(id);

        if (!blob) {
            return res.status(404).json({ error: 'Blob not found' });
        }

        res.json(blob);
    } catch (error) {
        console.error('Error reading blob:', error);
        res.status(500).json({ error: 'Failed to fetch blob' });
    }
});

// Get blobs owned by a specific Sui address
app.get('/api/blobs/owner/:address', (req, res) => {
    try {
        const { address } = req.params;
        const blobs = blobStorage.getAllBlobs().filter(blob => blob.ownerAddress === address);
        res.json(blobs);
    } catch (error) {
        console.error('Error reading blobs by owner:', error);
        res.status(500).json({ error: 'Failed to fetch blobs by owner' });
    }
});

// Get public blobs (accessible to everyone)
app.get('/api/blobs/public', (req, res) => {
    try {
        const blobs = blobStorage.getAllBlobs().filter(blob => blob.isPublic);
        res.json(blobs);
    } catch (error) {
        console.error('Error reading public blobs:', error);
        res.status(500).json({ error: 'Failed to fetch public blobs' });
    }
});

// Get blobs by ownership type with optional address
app.get('/api/blobs/ownership/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { address } = req.query;

        if (type === 'owned' && !address) {
            return res.status(400).json({ error: 'Address parameter required for owned blobs' });
        }

        const blobs = blobStorage.getAllBlobs().filter(blob => {
            const matchesType = (() => {
                if (type === 'owned') return blob.ownerAddress === address;
                if (type === 'public') return blob.isPublic;
                return true; // 'all'
            })();
            return matchesType;
        });
        res.json(blobs);
    } catch (error) {
        console.error('Error reading blobs by ownership:', error);
        res.status(500).json({ error: 'Failed to fetch blobs by ownership' });
    }
});

// Get database statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = blobStorage.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Delete blob
app.delete('/api/blobs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const success = blobStorage.deleteBlob(id);

        if (success) {
            res.json({ success: true, message: 'Blob deleted successfully' });
        } else {
            res.status(404).json({ error: 'Blob not found' });
        }
    } catch (error) {
        console.error('Error deleting blob:', error);
        res.status(500).json({ error: 'Failed to delete blob' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const stats = blobStorage.getStats();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'MedEarn server running with Walrus integration',
        walrusStatus: keypair ? 'Private key configured' : 'Private key parsing needed',
        suiNetwork: 'testnet',
        database: {
            totalBlobs: stats.totalBlobs,
            lastUpdated: stats.lastUpdated
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MedEarn server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
    console.log(`📚 Blobs endpoint: http://localhost:${PORT}/api/blobs`);
    console.log(`👀 Blobs preview: http://localhost:${PORT}/api/blobs/preview`);
    console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/blobs/search?q=query`);
    console.log(`👤 Ownership endpoints: http://localhost:${PORT}/api/blobs/owner/:address`);
    console.log(`🌍 Public blobs: http://localhost:${PORT}/api/blobs/public`);
    console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/stats`);
    console.log(`🌐 Web interface: http://localhost:${PORT}`);
    console.log(`🔑 Walrus Status: ${keypair ? 'Private key configured' : 'Private key parsing needed'}`);
    console.log(`💾 Database: ${blobStorage.getStats().totalBlobs} blobs loaded`);
    console.log(`📝 Note: Add proper Sui private key parsing to enable full Walrus functionality`);
}); 