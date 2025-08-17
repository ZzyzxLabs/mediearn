// Simple in-memory content store for temporary article content
class ContentStore {
    private store: Map<string, any> = new Map();

    // Store content temporarily
    setContent(blobId: string, content: any): void {
        console.log(`ContentStore: Storing content for blob ${blobId}`);
        this.store.set(blobId, {
            content,
            timestamp: Date.now(),
        });
    }

    // Get content
    getContent(blobId: string): any | null {
        const data = this.store.get(blobId);
        if (data) {
            console.log(`ContentStore: Found content for blob ${blobId}`);
            // Clean up after retrieval
            this.store.delete(blobId);
            return data.content;
        }
        console.log(`ContentStore: No content found for blob ${blobId}`);
        return null;
    }

    // Check if content exists
    hasContent(blobId: string): boolean {
        return this.store.has(blobId);
    }

    // Clear all content
    clear(): void {
        console.log('ContentStore: Clearing all content');
        this.store.clear();
    }

    // Get store size for debugging
    getSize(): number {
        return this.store.size;
    }
}

// Export singleton instance
export const contentStore = new ContentStore();
