import fs from 'fs';
import path from 'path';

// Simple blob info storage interface
export interface BlobInfo {
    id: string;
    title: string;
    uploadDate: string;
    ownerAddress: string;
    isPublic: boolean;
    previewText?: string; // Optional preview text stored locally
    accessControl: {
        type: 'payment-gated'; // All articles are payment-gated
        paymentDetails: {
            price: string;
            currency: string;
            paymentAddress: string;
            assetAddress: string;
            network: string;
        };
        maxAccessCount?: number;
    };
    // Track payments for access control
    payments: {
        [userAddress: string]: {
            paymentId: string;
            amount: string;
            timestamp: string;
            accessGranted: boolean;
        };
    };
    walrus: {
        contentBlob: {
            blobId: string;
            storageEpochs: number;
            isCertified: boolean;
            uploadStatus: string;
            uploadDate: string;
        };
        overallStatus: string;
    };
}

// Simple in-memory storage for blob info
export class BlobStorage {
    private blobs: Map<string, BlobInfo> = new Map();
    private readonly dataFile = 'data/blob-info.json';

    constructor() {
        this.loadBlobInfo();
        this.migrateExistingBlobs();
    }

    // Migrate existing blobs to new structure
    private migrateExistingBlobs(): void {
        let migrated = false;

        for (const [id, blob] of this.blobs) {
            if (!blob.accessControl) {
                // Add missing accessControl structure
                blob.accessControl = {
                    type: 'payment-gated',
                    paymentDetails: {
                        price: "0.01",
                        currency: "USDC",
                        paymentAddress: blob.ownerAddress,
                        assetAddress: "0xA0b86991C6218b36c1d19D4a2e9Eb0cE3606EB48",
                        network: "base-testnet"
                    }
                };
                migrated = true;
            }

            if (!blob.payments) {
                // Add missing payments tracking
                blob.payments = {};
                migrated = true;
            }
        }

        if (migrated) {
            console.log('🔄 Migrated existing blobs to new structure');
            this.saveBlobInfo();
        }
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.dataFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private loadBlobInfo(): void {
        try {
            this.ensureDirectory();
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const parsed = JSON.parse(data);
                if (parsed.blobs) {
                    this.blobs = new Map(Object.entries(parsed.blobs));
                }
                console.log(`📚 Blob info loaded: ${this.blobs.size} blobs`);
            }
        } catch (error) {
            console.error('❌ Error loading blob info:', error);
        }
    }

    private saveBlobInfo(): void {
        try {
            this.ensureDirectory();
            const data = {
                blobs: Object.fromEntries(this.blobs),
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error saving blob info:', error);
        }
    }

    createBlob(blobData: Omit<BlobInfo, 'id' | 'uploadDate' | 'payments'>, blobId: string): BlobInfo {
        const blob: BlobInfo = {
            ...blobData,
            id: blobId, // Use the provided blobId as the local ID
            uploadDate: new Date().toISOString(),
            accessControl: {
                type: 'payment-gated', // All articles are payment-gated
                paymentDetails: {
                    price: "0.01",
                    currency: "USDC",
                    paymentAddress: blobData.ownerAddress,
                    assetAddress: "0xA0b86991C6218b36c1d19D4a2e9Eb0cE3606EB48",
                    network: "base-testnet"
                }
            },
            payments: {}, // Initialize empty payments tracking
            walrus: blobData.walrus || {
                contentBlob: {
                    blobId: '',
                    storageEpochs: 1,
                    isCertified: false,
                    uploadStatus: 'pending',
                    uploadDate: new Date().toISOString()
                },
                overallStatus: 'pending'
            }
        };
        this.blobs.set(blobId, blob);
        this.saveBlobInfo();
        return blob;
    }

    // Record a payment for access
    recordPayment(blobId: string, userAddress: string, paymentId: string, amount: string): boolean {
        const blob = this.blobs.get(blobId);
        if (!blob) {
            return false;
        }

        blob.payments[userAddress] = {
            paymentId,
            amount,
            timestamp: new Date().toISOString(),
            accessGranted: true
        };

        this.saveBlobInfo();
        return true;
    }

    // Check if user has paid for access
    hasPaidAccess(blobId: string, userAddress: string): boolean {
        const blob = this.blobs.get(blobId);
        if (!blob) {
            return false;
        }

        const payment = blob.payments[userAddress];
        return payment?.accessGranted === true;
    }

    // Get payment info for a user
    getPaymentInfo(blobId: string, userAddress: string) {
        const blob = this.blobs.get(blobId);
        if (!blob) {
            return null;
        }

        return blob.payments[userAddress] || null;
    }

    getAllBlobs(): BlobInfo[] {
        return Array.from(this.blobs.values());
    }

    getBlob(id: string): BlobInfo | null {
        return this.blobs.get(id) || null;
    }

    deleteBlob(id: string): boolean {
        const deleted = this.blobs.delete(id);
        if (deleted) {
            this.saveBlobInfo();
        }
        return deleted;
    }

    getStats() {
        return {
            totalBlobs: this.blobs.size,
            lastUpdated: new Date().toISOString()
        };
    }
}
