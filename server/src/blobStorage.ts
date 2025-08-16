import fs from 'fs';
import path from 'path';

// Simple blob info storage interface
export interface BlobInfo {
    id: string;
    title: string;
    originalFileSize: number;
    uploadDate: string;
    ownerAddress: string;
    isPublic: boolean;
    previewText?: string; // Optional preview text stored locally
    walrus: {
        contentBlob: {
            blobId: string | null;
            storageEpochs: number | null;
            isCertified: boolean;
            uploadStatus: 'pending' | 'success' | 'failed';
            uploadDate: string | null;
            errorMessage?: string;
        };
        overallStatus: 'pending' | 'success' | 'failed' | 'partial';
    };
}

// Simple in-memory storage for blob info
export class BlobStorage {
    private blobs: Map<string, BlobInfo> = new Map();
    private blobInfoFile = 'data/blob-info.json';

    constructor() {
        this.loadBlobInfo();
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.blobInfoFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private loadBlobInfo(): void {
        try {
            this.ensureDirectory();
            if (fs.existsSync(this.blobInfoFile)) {
                const data = fs.readFileSync(this.blobInfoFile, 'utf8');
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
            fs.writeFileSync(this.blobInfoFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error saving blob info:', error);
        }
    }

    createBlob(blobData: Omit<BlobInfo, 'id' | 'uploadDate'>): BlobInfo {
        const id = Date.now().toString();
        const blob: BlobInfo = {
            ...blobData,
            id,
            uploadDate: new Date().toISOString()
        };

        this.blobs.set(id, blob);
        this.saveBlobInfo();
        return blob;
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
