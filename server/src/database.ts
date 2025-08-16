import fs from 'fs';
import path from 'path';

export interface Article {
  id: string;
  fileName: string;
  originalFileSize: number;
  uploadDate: string;
  lastModified: string;
  version: string;

  // Walrus storage information
  walrus: {
    previewBlob: {
      blobId: string | null;
      objectId: string | null;
      storageEpochs: number | null;
      isCertified: boolean;
      uploadStatus: 'pending' | 'success' | 'failed' | 'local-only';
      uploadDate: string | null;
      errorMessage?: string;
    };
    contentBlob: {
      blobId: string | null;
      objectId: string | null;
      storageEpochs: number | null;
      isCertified: boolean;
      uploadStatus: 'pending' | 'success' | 'failed' | 'local-only';
      uploadDate: string | null;
      errorMessage?: string;
    };
    overallStatus: 'pending' | 'success' | 'failed' | 'partial' | 'local-only';
  };

  // Local storage information (fallback)
  local: {
    filePath: string | null;
    fileSize: number | null;
    isCompressed: boolean;
  };

  // Metadata for search and organization
  tags: string[];
  author?: string;

  // Ownership information (simplified)
  owner: {
    suiAddress: string;           // Sui address of the article owner
    isPublic: boolean;            // Whether article is publicly accessible
    transferable: boolean;        // Whether ownership can be transferred
  };
}

export interface DatabaseStats {
  totalArticles: number;
  totalSize: number;
  uploadStatus: Record<string, number>;
  blobStatus: Record<string, number>;  // Preview vs Content blob status
  lastBackup: string;
}

export class ArticleDatabase {
  private dbPath: string;
  private articles: Map<string, Article>;
  private stats: DatabaseStats;

  constructor(dbPath: string = 'data/articles.json') {
    this.dbPath = dbPath;
    this.articles = new Map();
    this.stats = this.initializeStats();
    this.loadDatabase();
  }

  private initializeStats(): DatabaseStats {
    return {
      totalArticles: 0,
      totalSize: 0,
      uploadStatus: {},
      blobStatus: {},
      lastBackup: new Date().toISOString()
    };
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadDatabase(): void {
    try {
      this.ensureDirectory();
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(data);

        if (parsed.articles) {
          // Validate and migrate articles to ensure they have all required properties
          const validatedArticles = new Map<string, Article>();
          for (const [id, articleData] of Object.entries(parsed.articles)) {
            const validatedArticle = this.validateAndMigrateArticle(articleData as any);
            if (validatedArticle) {
              validatedArticles.set(id, validatedArticle);
            }
          }
          this.articles = validatedArticles;
        }
        if (parsed.stats) {
          this.stats = { ...this.stats, ...parsed.stats };
        }

        this.updateStats();
        console.log(`📚 Database loaded: ${this.articles.size} articles`);
      } else {
        console.log('📚 Creating new database file');
        this.saveDatabase();
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      console.log('📚 Creating new database file');
      this.saveDatabase();
    }
  }

  // Validate and migrate article data to ensure all required properties exist
  private validateAndMigrateArticle(articleData: any): Article | null {
    try {
      // Ensure all required properties exist with default values
      const article: Article = {
        id: articleData.id || '',
        fileName: articleData.fileName || '',
        originalFileSize: articleData.originalFileSize || 0,
        uploadDate: articleData.uploadDate || new Date().toISOString(),
        lastModified: articleData.lastModified || new Date().toISOString(),
        version: articleData.version || '1.0.0',
        tags: Array.isArray(articleData.tags) ? articleData.tags : [],
        author: articleData.author || '',

        // Ensure walrus property exists with all required fields
        walrus: {
          previewBlob: {
            blobId: articleData.walrus?.previewBlob?.blobId || null,
            objectId: articleData.walrus?.previewBlob?.objectId || null,
            storageEpochs: articleData.walrus?.previewBlob?.storageEpochs || null,
            isCertified: articleData.walrus?.previewBlob?.isCertified || false,
            uploadStatus: articleData.walrus?.previewBlob?.uploadStatus || 'local-only',
            uploadDate: articleData.walrus?.previewBlob?.uploadDate || null,
            errorMessage: articleData.walrus?.previewBlob?.errorMessage
          },
          contentBlob: {
            blobId: articleData.walrus?.contentBlob?.blobId || null,
            objectId: articleData.walrus?.contentBlob?.objectId || null,
            storageEpochs: articleData.walrus?.contentBlob?.storageEpochs || null,
            isCertified: articleData.walrus?.contentBlob?.isCertified || false,
            uploadStatus: articleData.walrus?.contentBlob?.uploadStatus || 'local-only',
            uploadDate: articleData.walrus?.contentBlob?.uploadDate || null,
            errorMessage: articleData.walrus?.contentBlob?.errorMessage
          },
          overallStatus: articleData.walrus?.overallStatus || 'local-only'
        },

        // Ensure local property exists with all required fields
        local: {
          filePath: articleData.local?.filePath || null,
          fileSize: articleData.local?.fileSize || null,
          isCompressed: articleData.local?.isCompressed || false
        },

        // Ensure owner property exists with all required fields
        owner: {
          suiAddress: articleData.owner?.suiAddress || '',
          isPublic: articleData.owner?.isPublic || false,
          transferable: articleData.owner?.transferable || false
        }
      };

      return article;
    } catch (error) {
      console.error('❌ Error validating article:', error, articleData);
      return null;
    }
  }

  private saveDatabase(): void {
    try {
      this.ensureDirectory();
      const data = {
        articles: Object.fromEntries(this.articles),
        stats: this.stats,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
      console.log('💾 Database saved successfully');
    } catch (error) {
      console.error('❌ Error saving database:', error);
    }
  }

  private updateStats(): void {
    this.stats.totalArticles = this.articles.size;
    this.stats.totalSize = 0;

    this.stats.uploadStatus = {};
    this.stats.blobStatus = {};

    for (const article of this.articles.values()) {
      try {
        // Update total size
        if (article.local?.fileSize) {
          this.stats.totalSize += article.local.fileSize;
        }

        // Update category counts


        // Update overall upload status counts with safety checks
        if (article.walrus?.overallStatus) {
          this.stats.uploadStatus[article.walrus.overallStatus] = (this.stats.uploadStatus[article.walrus.overallStatus] || 0) + 1;
        }

        // Update blob status counts with safety checks
        if (article.walrus?.previewBlob?.uploadStatus) {
          this.stats.blobStatus[article.walrus.previewBlob.uploadStatus] = (this.stats.blobStatus[article.walrus.previewBlob.uploadStatus] || 0) + 1;
        }
        if (article.walrus?.contentBlob?.uploadStatus) {
          this.stats.blobStatus[article.walrus.contentBlob.uploadStatus] = (this.stats.blobStatus[article.walrus.contentBlob.uploadStatus] || 0) + 1;
        }
      } catch (error) {
        console.error('❌ Error updating stats for article:', article.id || 'unknown', error);
        // Continue with other articles even if one fails
      }
    }

    this.stats.lastBackup = new Date().toISOString();
  }

  // Create a new article
  createArticle(articleData: Omit<Article, 'id' | 'uploadDate' | 'lastModified' | 'version'>): Article {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const article: Article = {
      ...articleData,
      id,
      uploadDate: now,
      lastModified: now,
      version: '1.0.0'
    };

    this.articles.set(id, article);
    this.updateStats();
    this.saveDatabase();

    console.log(`📝 Article created: ${article.fileName} (ID: ${id})`);
    return article;
  }

  // Update an existing article
  updateArticle(id: string, updates: Partial<Article>): Article | null {
    const article = this.articles.get(id);
    if (!article) {
      console.warn(`⚠️ Article not found: ${id}`);
      return null;
    }

    const updatedArticle: Article = {
      ...article,
      ...updates,
      lastModified: new Date().toISOString(),
      version: this.incrementVersion(article.version || '1.0.0')
    };

    this.articles.set(id, updatedArticle);
    this.updateStats();
    this.saveDatabase();

    console.log(`📝 Article updated: ${updatedArticle.fileName} (ID: ${id})`);
    return updatedArticle;
  }

  // Update Walrus information for an article
  updateWalrusInfo(id: string, walrusInfo: Partial<Article['walrus']>): Article | null {
    const article = this.articles.get(id);
    if (!article) {
      return null;
    }

    const updatedWalrus = {
      ...article.walrus,
      ...walrusInfo
    };

    return this.updateArticle(id, { walrus: updatedWalrus });
  }

  // Get article by ID
  getArticle(id: string): Article | null {
    return this.articles.get(id) || null;
  }

  // Get all articles
  getAllArticles(): Article[] {
    return Array.from(this.articles.values());
  }

  // Get articles with only preview information (for browsing)
  getArticlesPreview(): Omit<Article, 'walrus' | 'local'>[] {
    return Array.from(this.articles.values()).map(article => ({
      id: article.id || '',

      fileName: article.fileName || '',
      originalFileSize: article.originalFileSize || 0,

      uploadDate: article.uploadDate || new Date().toISOString(),
      lastModified: article.lastModified || new Date().toISOString(),
      tags: article.tags || [],
      author: article.author || '',
      version: article.version || '1.0.0',
      owner: article.owner || {
        suiAddress: '',
        isPublic: false,
        transferable: false
      }
    }));
  }



  // Get articles by upload status
  getArticlesByStatus(status: Article['walrus']['overallStatus']): Article[] {
    return Array.from(this.articles.values()).filter(article =>
      article.walrus?.overallStatus === status
    );
  }

  // Get articles owned by a specific Sui address
  getArticlesByOwner(suiAddress: string): Article[] {
    return Array.from(this.articles.values()).filter(article =>
      article.owner?.suiAddress === suiAddress
    );
  }

  // Get public articles (accessible to everyone)
  getPublicArticles(): Article[] {
    return Array.from(this.articles.values()).filter(article => article.owner?.isPublic);
  }

  // Get articles by ownership type
  getArticlesByOwnershipType(type: 'owned' | 'public' | 'all', suiAddress?: string): Article[] {
    switch (type) {
      case 'owned':
        if (!suiAddress) return [];
        return this.getArticlesByOwner(suiAddress);
      case 'public':
        return this.getPublicArticles();
      case 'all':
        return suiAddress ? this.getArticlesByOwner(suiAddress) : this.getAllArticles();
      default:
        return [];
    }
  }

  // Search articles by tags and filename
  searchArticles(query: string): Article[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.articles.values()).filter(article =>
      (article.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (article.fileName || '').toLowerCase().includes(lowerQuery)
    );
  }

  // Delete article
  deleteArticle(id: string): boolean {
    const article = this.articles.get(id);
    if (!article) {
      return false;
    }

    // Remove local file if it exists
    if (article.local?.filePath && fs.existsSync(article.local.filePath)) {
      try {
        fs.unlinkSync(article.local.filePath);
        console.log(`🗑️ Local file deleted: ${article.local.filePath}`);
      } catch (error) {
        console.error('❌ Error deleting local file:', error);
      }
    }

    this.articles.delete(id);
    this.updateStats();
    this.saveDatabase();

    console.log(`🗑️ Article deleted: ${article.fileName} (ID: ${id})`);
    return true;
  }

  // Get database statistics
  getStats(): DatabaseStats {
    return { ...this.stats };
  }

  // Backup database
  backup(): string {
    const backupPath = `data/backup/articles_${Date.now()}.json`;
    try {
      this.ensureDirectory();
      const data = {
        articles: Object.fromEntries(this.articles),
        stats: this.stats,
        backupDate: new Date().toISOString()
      };
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      console.log(`💾 Database backed up to: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  // Clean up old backups (keep last 5)
  cleanupBackups(): void {
    try {
      const backupDir = 'data/backup';
      if (!fs.existsSync(backupDir)) return;

      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only the last 5 backups
      if (files.length > 5) {
        const toDelete = files.slice(5);
        for (const file of toDelete) {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Old backup deleted: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up backups:', error);
    }
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
}

// Export singleton instance
export const articleDB = new ArticleDatabase();
