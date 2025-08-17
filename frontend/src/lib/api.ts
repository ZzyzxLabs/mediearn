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
  description?: string;
}

export interface ArticlePreview {
  blobId: string;
  title: string;
  description: string;
  ownerAddress: string;
  uploadDate: string;
  paymentRequired: boolean;
  paymentDetails: {
    price: string;
    currency: string;
    network: string;
  };
}

export interface ArticleContent {
  blobId: string;
  title: string;
  content: string;
  metadata: {
    uploadDate: string;
    ownerAddress: string;
    isPublic: boolean;
    paymentInfo?: Record<string, unknown>;
  };
}

export interface BlobPreview {
  blobId: string;
  title: string;
  description: string;
  contentPreview: string;
  ownerAddress: string;
  uploadDate: string;
  paymentRequired: boolean;
  paymentDetails: {
    price: string;
    currency: string;
    network: string;
  };
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  blobInfo?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
  walrusStatus: string;
  suiNetwork: string;
  database: {
    totalBlobs: number;
    lastUpdated: string;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error("Health check failed");
      }
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
        description: metadata.description,
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

  // Get blob previews (matches server endpoint)
  async getBlobPreviews(): Promise<ArticlePreview[]> {
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

  // Get blob preview text (no payment required)
  async getBlobPreview(id: string): Promise<BlobPreview | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/${id}/preview`);
      if (!response.ok) {
        throw new Error("Failed to fetch blob preview");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch blob preview:", error);
      return null;
    }
  }

  // Get blob content (matches server endpoint with userAddress parameter)
  async getBlobContent(
    id: string,
    userAddress: string
  ): Promise<ArticleContent | null> {
    try {
      const response = await fetch(
        `${this.baseUrl
        }/api/blobs/${id}/content?userAddress=${encodeURIComponent(
          userAddress
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch blob content");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch blob content:", error);
      return null;
    }
  }

  // Delete blob
  async deleteBlob(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/blobs/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to delete blob:", error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
