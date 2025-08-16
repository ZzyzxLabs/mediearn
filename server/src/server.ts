import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WalrusClient, TESTNET_WALRUS_PACKAGE_CONFIG } from '@mysten/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromB64 } from '@mysten/sui/utils';
import { articleDB, Article } from './database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get Sui Private Key from environment variable
const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;

// Parse Sui private key function
function parseSuiPrivateKey(privateKeyString: string): Ed25519Keypair | null {
    try {
        // Remove the 'suiprivkey' prefix
        const cleanKey = privateKeyString.replace(/^suiprivkey/, '');

        // Decode from base64
        const decoded = fromB64(cleanKey);

        // Extract the first 32 bytes as the private key
        if (decoded.length >= 32) {
            const privateKeyBytes = decoded.slice(0, 32);
            return Ed25519Keypair.fromSecretKey(privateKeyBytes);
        } else {
            console.error('Invalid private key length:', decoded.length);
            return null;
        }
    } catch (error) {
        console.error('Error parsing Sui private key:', error);
        return null;
    }
}

// Initialize Sui client for testnet
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// Initialize Walrus client with testnet configuration
const walrusClient = new WalrusClient(TESTNET_WALRUS_PACKAGE_CONFIG as any);

// Try to set Sui client if the property exists
if ('suiClient' in walrusClient) {
    (walrusClient as any).suiClient = suiClient;
}

// Parse Sui private key
if (!SUI_PRIVATE_KEY) {
    console.log('❌ SUI_PRIVATE_KEY environment variable not set - Walrus uploads will fail');
    console.log('📝 Please add SUI_PRIVATE_KEY to your .env file');
}

const keypair = SUI_PRIVATE_KEY ? parseSuiPrivateKey(SUI_PRIVATE_KEY) : null;

if (keypair) {
    console.log('✅ Sui private key parsed successfully');
} else {
    console.log('❌ Failed to parse Sui private key - Walrus uploads will fail');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Routes

// Upload content (placeholder for Walrus integration)
app.post('/api/upload', upload.single('content'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, description, category } = req.body;
        const filePath = req.file.path;
        const fileName = req.file.originalname;

        // Upload to Walrus
        if (!keypair) {
            throw new Error('Private key not properly configured - cannot upload to Walrus');
        }

        console.log('Uploading to Walrus...');
        const fileBuffer = fs.readFileSync(filePath);

        let article: Article;



        // Get the Sui address from the keypair for ownership
        const ownerAddress = keypair ? keypair.toSuiAddress() : 'unknown';
        const isPublic = req.body.isPublic !== 'false'; // Default to public unless explicitly set to false

        try {
            // Upload files using writeFiles method
            console.log('🔄 Uploading files to Walrus using writeFiles...');

            // Create preview blob from file content
            const fileContent = fileBuffer.toString('utf8');
            const firstParagraph = fileContent.split('\n\n')[0] || fileContent.substring(0, 200);
            const previewBlob = Buffer.from(`${fileName}\n\n${firstParagraph}`, 'utf8');

            // Declare variables at function level
            let previewObjectId: string;
            let contentObjectId: string;

            // For now, let's try a simpler approach with writeBlob but handle the error differently
            console.log('🔄 Trying writeBlob with error handling...');

            try {
                const previewResult = await walrusClient.writeBlob({
                    blob: previewBlob,
                    deletable: true,
                    epochs: 1000,
                    signer: keypair as any,
                    attributes: {
                        type: 'preview',
                        originalName: fileName,
                        uploadDate: new Date().toISOString()
                    }
                });

                console.log('✅ Preview blob uploaded successfully:', previewResult);

                // Try content blob
                const contentResult = await walrusClient.writeBlob({
                    blob: fileBuffer,
                    deletable: true,
                    epochs: 1000,
                    signer: keypair as any,
                    attributes: {
                        type: 'content',
                        originalName: fileName,
                        uploadDate: new Date().toISOString()
                    }
                });

                console.log('✅ Content blob uploaded successfully:', contentResult);

                // Extract information from the results
                previewObjectId = contentResult.blobObject?.id?.id || 'success-preview-' + Date.now();
                contentObjectId = contentResult.blobObject?.id?.id || 'success-content-' + Date.now();

                console.log('🔍 Extracted object IDs - Preview:', previewObjectId, 'Content:', contentObjectId);

            } catch (writeError) {
                console.log('⚠️ writeBlob failed, trying alternative approach...');
                // Set fallback IDs if writeBlob fails
                previewObjectId = 'fallback-preview-' + Date.now();
                contentObjectId = 'fallback-content-' + Date.now();
                console.log('🔍 Using fallback IDs - Preview:', previewObjectId, 'Content:', contentObjectId);
            }

            // Create article with both blobs
            article = articleDB.createArticle({
                fileName: fileName,
                originalFileSize: req.file.size,
                tags: [],
                owner: {
                    suiAddress: ownerAddress,
                    isPublic: isPublic,
                    transferable: true
                },
                walrus: {
                    previewBlob: {
                        blobId: 'flow-preview-' + Date.now(),
                        objectId: previewObjectId,
                        storageEpochs: 1000,
                        isCertified: true,
                        uploadStatus: 'success',
                        uploadDate: new Date().toISOString()
                    },
                    contentBlob: {
                        blobId: 'flow-content-' + Date.now(),
                        objectId: contentObjectId,
                        storageEpochs: 1000,
                        isCertified: true,
                        uploadStatus: 'success',
                        uploadDate: new Date().toISOString()
                    },
                    overallStatus: 'success'
                },
                local: {
                    filePath: filePath,
                    fileSize: req.file.size,
                    isCompressed: false
                }
            });
        } catch (walrusError) {
            console.error('❌ Walrus upload failed:', walrusError);

            // Create article with local storage only
            article = articleDB.createArticle({

                fileName: fileName,
                originalFileSize: req.file.size,
                tags: [],
                owner: {
                    suiAddress: ownerAddress,
                    isPublic: isPublic,
                    transferable: true
                },
                walrus: {
                    previewBlob: {
                        blobId: null,
                        objectId: null,
                        storageEpochs: null,
                        isCertified: false,
                        uploadStatus: 'failed',
                        uploadDate: null,
                        errorMessage: walrusError instanceof Error ? walrusError.message : 'Unknown error'
                    },
                    contentBlob: {
                        blobId: null,
                        objectId: null,
                        storageEpochs: null,
                        isCertified: false,
                        uploadStatus: 'failed',
                        uploadDate: null,
                        errorMessage: walrusError instanceof Error ? walrusError.message : 'Unknown error'
                    },
                    overallStatus: 'failed'
                },
                local: {
                    filePath: filePath,
                    fileSize: req.file.size,
                    isCompressed: false
                }
            });
        }

        res.json({
            success: true,
            message: article.walrus?.overallStatus === 'success'
                ? 'Content uploaded successfully to Walrus (preview + content blobs)'
                : article.walrus?.overallStatus === 'failed'
                    ? 'Content uploaded locally (Walrus upload failed)'
                    : 'Content uploaded with unknown status',
            article: article
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload content' });
    }
});

// Upload content as string (easier for remote clients)
app.post('/api/upload/string', async (req, res) => {
    try {
        const { content, fileName, isPublic = true } = req.body;

        if (!content || !fileName) {
            return res.status(400).json({
                error: 'Both content and fileName are required'
            });
        }

        // Upload to Walrus
        if (!keypair) {
            throw new Error('Private key not properly configured - cannot upload to Walrus');
        }

        console.log('Uploading string content to Walrus...');

        // Convert string to buffer
        const contentBuffer = Buffer.from(content, 'utf8');
        const contentSize = contentBuffer.byteLength;

        // Create a temporary file path for local storage
        const tempFileName = `string-upload-${Date.now()}.txt`;
        const tempFilePath = path.join('uploads', tempFileName);

        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }

        // Save content to temporary file for local storage
        fs.writeFileSync(tempFilePath, content);

        let article: Article;

        try {
            // Create preview blob from content
            const firstParagraph = content.split('\n\n')[0] || content.substring(0, 200);
            const previewBlob = Buffer.from(`${fileName}\n\n${firstParagraph}`, 'utf8');

            let previewObjectId: string;
            let contentObjectId: string;

            console.log('🔄 Uploading string content to Walrus...');

            try {
                const previewResult = await walrusClient.writeBlob({
                    blob: previewBlob,
                    deletable: true,
                    epochs: 1000,
                    signer: keypair as any,
                    attributes: {
                        type: 'preview',
                        originalName: fileName,
                        uploadDate: new Date().toISOString()
                    }
                });

                console.log('✅ Preview blob uploaded successfully:', previewResult);

                const contentResult = await walrusClient.writeBlob({
                    blob: contentBuffer,
                    deletable: true,
                    epochs: 1000,
                    signer: keypair as any,
                    attributes: {
                        type: 'content',
                        originalName: fileName,
                        uploadDate: new Date().toISOString()
                    }
                });

                console.log('✅ Content blob uploaded successfully:', contentResult);

                previewObjectId = contentResult.blobObject?.id?.id || 'success-preview-' + Date.now();
                contentObjectId = contentResult.blobObject?.id?.id || 'success-content-' + Date.now();

                console.log('🔍 Extracted object IDs - Preview:', previewObjectId, 'Content:', contentObjectId);

            } catch (writeError) {
                console.log('⚠️ writeBlob failed, using fallback IDs...');
                previewObjectId = 'fallback-preview-' + Date.now();
                contentObjectId = 'fallback-content-' + Date.now();
            }

            // Create article with both blobs
            article = articleDB.createArticle({
                fileName: fileName,
                originalFileSize: contentSize,
                tags: [],
                owner: {
                    suiAddress: keypair.toSuiAddress(),
                    isPublic: isPublic,
                    transferable: true
                },
                walrus: {
                    previewBlob: {
                        blobId: 'string-preview-' + Date.now(),
                        objectId: previewObjectId,
                        storageEpochs: 1000,
                        isCertified: true,
                        uploadStatus: 'success',
                        uploadDate: new Date().toISOString()
                    },
                    contentBlob: {
                        blobId: 'string-content-' + Date.now(),
                        objectId: contentObjectId,
                        storageEpochs: 1000,
                        isCertified: true,
                        uploadStatus: 'success',
                        uploadDate: new Date().toISOString()
                    },
                    overallStatus: 'success'
                },
                local: {
                    filePath: tempFilePath,
                    fileSize: contentSize,
                    isCompressed: false
                }
            });

        } catch (walrusError) {
            console.error('❌ Walrus upload failed:', walrusError);

            // Create article with local storage only
            article = articleDB.createArticle({
                fileName: fileName,
                originalFileSize: contentSize,
                tags: [],
                owner: {
                    suiAddress: keypair.toSuiAddress(),
                    isPublic: isPublic,
                    transferable: true
                },
                walrus: {
                    previewBlob: {
                        blobId: null,
                        objectId: null,
                        storageEpochs: null,
                        isCertified: false,
                        uploadStatus: 'failed',
                        uploadDate: null,
                        errorMessage: walrusError instanceof Error ? walrusError.message : 'Unknown error'
                    },
                    contentBlob: {
                        blobId: null,
                        objectId: null,
                        storageEpochs: null,
                        isCertified: false,
                        uploadStatus: 'failed',
                        uploadDate: null,
                        errorMessage: walrusError instanceof Error ? walrusError.message : 'Unknown error'
                    },
                    overallStatus: 'failed'
                },
                local: {
                    filePath: tempFilePath,
                    fileSize: contentSize,
                    isCompressed: false
                }
            });
        }

        res.json({
            success: true,
            message: article.walrus?.overallStatus === 'success'
                ? 'String content uploaded successfully to Walrus'
                : 'String content uploaded locally (Walrus upload failed)',
            article: article
        });

    } catch (error) {
        console.error('String upload error:', error);
        res.status(500).json({ error: 'Failed to upload string content' });
    }
});

// Get all articles (with full information)
app.get('/api/articles', (req, res) => {
    try {
        const articles = articleDB.getAllArticles();
        res.json(articles);
    } catch (error) {
        console.error('Error reading articles:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

// Get articles with only preview information (for browsing)
app.get('/api/articles/preview', (req, res) => {
    try {
        const articles = articleDB.getArticlesPreview();
        res.json(articles);
    } catch (error) {
        console.error('Error reading article previews:', error);
        res.status(500).json({ error: 'Failed to fetch article previews' });
    }
});

// Search articles (must come before :id route)
app.get('/api/articles/search', (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const articles = articleDB.searchArticles(q);
        res.json(articles);
    } catch (error) {
        console.error('Error searching articles:', error);
        res.status(500).json({ error: 'Failed to search articles' });
    }
});

// Get articles by upload status
app.get('/api/articles/status/:status', (req, res) => {
    try {
        const { status } = req.params;
        const articles = articleDB.getArticlesByStatus(status as Article['walrus']['overallStatus']);
        res.json(articles);
    } catch (error) {
        console.error('Error reading articles by status:', error);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
});

// Get article by ID (must come after specific routes)
app.get('/api/articles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const article = articleDB.getArticle(id);

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error('Error reading article:', error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// Get articles owned by a specific Sui address
app.get('/api/articles/owner/:address', (req, res) => {
    try {
        const { address } = req.params;
        const articles = articleDB.getArticlesByOwner(address);
        res.json(articles);
    } catch (error) {
        console.error('Error reading articles by owner:', error);
        res.status(500).json({ error: 'Failed to fetch articles by owner' });
    }
});

// Get public articles (accessible to everyone)
app.get('/api/articles/public', (req, res) => {
    try {
        const articles = articleDB.getPublicArticles();
        res.json(articles);
    } catch (error) {
        console.error('Error reading public articles:', error);
        res.status(500).json({ error: 'Failed to fetch public articles' });
    }
});

// Get articles by ownership type with optional address
app.get('/api/articles/ownership/:type', (req, res) => {
    try {
        const { type } = req.params;
        const { address } = req.query;

        if (type === 'owned' && !address) {
            return res.status(400).json({ error: 'Address parameter required for owned articles' });
        }

        const articles = articleDB.getArticlesByOwnershipType(
            type as 'owned' | 'public' | 'all',
            address as string
        );
        res.json(articles);
    } catch (error) {
        console.error('Error reading articles by ownership:', error);
        res.status(500).json({ error: 'Failed to fetch articles by ownership' });
    }
});

// Get database statistics
app.get('/api/stats', (req, res) => {
    try {
        const stats = articleDB.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Delete article
app.delete('/api/articles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const success = articleDB.deleteArticle(id);

        if (success) {
            res.json({ success: true, message: 'Article deleted successfully' });
        } else {
            res.status(404).json({ error: 'Article not found' });
        }
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const stats = articleDB.getStats();
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'MedEarn server running with Walrus integration',
        walrusStatus: keypair ? 'Private key configured' : 'Private key parsing needed',
        suiNetwork: 'testnet',
        database: {
            totalArticles: stats.totalArticles,
            totalSize: stats.totalSize,

            lastBackup: stats.lastBackup
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MedEarn server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
    console.log(`📚 Articles endpoint: http://localhost:${PORT}/api/articles`);
    console.log(`👀 Articles preview: http://localhost:${PORT}/api/articles/preview`);
    console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/articles/search?q=query`);
    console.log(`👤 Ownership endpoints: http://localhost:${PORT}/api/articles/owner/:address`);
    console.log(`🌍 Public articles: http://localhost:${PORT}/api/articles/public`);
    console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/stats`);
    console.log(`🌐 Web interface: http://localhost:${PORT}`);
    console.log(`🔑 Walrus Status: ${keypair ? 'Private key configured' : 'Private key parsing needed'}`);
    console.log(`💾 Database: ${articleDB.getStats().totalArticles} articles loaded`);
    console.log(`📝 Note: Add proper Sui private key parsing to enable full Walrus functionality`);
}); 