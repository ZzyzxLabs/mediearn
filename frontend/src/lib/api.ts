const API_BASE_URL = "http://localhost:8000";

export interface ArticleMetadata {
  title: string;
  description: string;
  category: string;
}

export interface UploadRequest {
  title: string;
  content: string;
  ownerAddress: string;
  isPublic?: boolean;
}

export interface Article {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  ownerAddress?: string;
  previewBlob?: string;
  contentBlob?: string;
  createdAt?: string;
  fileName?: string;
  originalFileSize?: number;
  uploadDate?: string;
  lastModified?: string;
  version?: string;
  tags?: string[];
  author?: string;
  owner?: {
    suiAddress: string;
    isPublic: boolean;
    transferable: boolean;
  };
}

export interface UploadResponse {
  success: boolean;
  articleId?: string;
  error?: string;
  message?: string;
  blobInfo?: Record<string, unknown>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  // Upload article
  async uploadArticle(
    file: File,
    metadata: ArticleMetadata,
    ownerAddress: string
  ): Promise<UploadResponse> {
    try {
      // Read file content as text
      const content = await file.text();

      const uploadData: UploadRequest = {
        title: metadata.title,
        content: content,
        ownerAddress: ownerAddress,
        isPublic: true, // Default to public
      };

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      return result;
    } catch (error) {
      console.error("Upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // Get all articles (now blobs)
  async getArticles(): Promise<Article[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs`);
      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      return [];
    }
  }

  // Get article by ID (now blob by ID)
  async getArticle(id: string): Promise<Article | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch article");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch article:", error);
      return null;
    }
  }

  // Get articles by owner address
  async getArticlesByOwner(address: string): Promise<Article[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/blobs/owner/${address}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch owner articles");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch owner articles:", error);
      return [];
    }
  }

  // Get public articles
  async getPublicArticles(): Promise<Article[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/public`);
      if (!response.ok) {
        throw new Error("Failed to fetch public articles");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch public articles:", error);
      return [];
    }
  }

  // Search articles
  async searchArticles(query: string): Promise<Article[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/blobs/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Failed to search articles");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to search articles:", error);
      return [];
    }
  }

  // Delete article
  async deleteArticle(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to delete article:", error);
      return false;
    }
  }

  // Get blob content from Walrus
  async getBlobContent(id: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/${id}/content`);
      if (!response.ok) {
        throw new Error("Failed to fetch blob content");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch blob content:", error);
      return null;
    }
  }

  // Get blob previews
  async getBlobPreviews(): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/preview`);
      if (!response.ok) {
        throw new Error("Failed to fetch blob previews");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch blob previews:", error);
      return [];
    }
  }
}

export const apiClient = new ApiClient();
