# MedEarn - Content Management Server

A TypeScript-based server for managing content uploads and serving articles, with planned integration for the Walrus decentralized storage system.

## Features

- **File Upload Management**: Handle file uploads with metadata (title, description, category)
- **Article Storage**: Store and retrieve article metadata locally
- **RESTful API**: Clean API endpoints for content management
- **Web Interface**: Modern, responsive web UI for content management
- **File Type Support**: Support for various file types with configurable size limits
- **Category Organization**: Organize content by categories (medical, research, education, etc.)

## Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **File Handling**: Multer for multipart file uploads
- **Storage**: Local file system + JSON metadata storage
- **Frontend**: Vanilla HTML/CSS/JavaScript with modern UI
- **Future**: Walrus decentralized storage integration

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd medearn
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

## Development

For development with auto-reload:
```bash
npm run dev
```

## 🚀 API Reference for Frontend Developers

### **Base URL**
```
http://localhost:3000
```

### **Two-Blob Storage System**

The MedEarn backend uses a two-blob storage system for optimal content delivery:

1. **Preview Blob**: Contains title + first paragraph for quick browsing
   - Fast loading for article lists
   - Minimal bandwidth usage
   - Perfect for search results and browsing

2. **Content Blob**: Contains the full article content
   - Full article when user clicks to read
   - Larger file size
   - Complete content access

**Benefits:**
- **Fast browsing**: Clients get previews instantly
- **Bandwidth efficient**: Only download full content when needed
- **Better UX**: Users can quickly scan multiple articles
- **Scalable**: Preview blobs are small and fast to serve

### **Article Ownership System**

The MedEarn backend automatically tracks article ownership using Sui addresses:

1. **Automatic Ownership**: When uploading, the server extracts the Sui address from your private key
2. **Ownership Tracking**: Each article is linked to its owner's Sui address
3. **Access Control**: Articles can be public or private
4. **Ownership Queries**: Find articles by owner address

**How It Works:**
- **Upload**: Server automatically detects your Sui address from the keypair
- **Storage**: Article ownership is stored in the database
- **Querying**: Use ownership endpoints to find your articles
- **Privacy**: Control whether articles are public or private

### **API Endpoints**

#### **Health Check**
- **Endpoint**: `GET /api/health`
- **Description**: Check server status and Walrus configuration
- **Response**: Server health, Walrus status, and network information

#### **Content Upload**
- **Endpoint**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Required Fields**:
  - `title` (string): Article title
  - `content` (file): File to upload
- **Optional Fields**:
  - `description` (string): Article description
  - `category` (string): Article category (defaults to "general")
- **Response**: Upload status, article metadata, and Walrus ID

#### **Article Management**
- **Endpoint**: `GET /api/articles`
- **Description**: Retrieve all articles with full information (including Walrus blob details)
- **Response**: Array of complete article objects

- **Endpoint**: `GET /api/articles/preview`
- **Description**: Retrieve articles with only preview information (title + first paragraph) - optimized for browsing
- **Response**: Array of article previews (excludes Walrus and local storage details)

- **Endpoint**: `GET /api/articles/:id`
- **Description**: Get specific article by ID with full information
- **Response**: Single complete article object

- **Endpoint**: `GET /api/articles/category/:category`
- **Description**: Filter articles by category
- **Response**: Array of articles in specified category

#### **Ownership & Access Control**
- **Endpoint**: `GET /api/articles/owner/:address`
- **Description**: Get articles owned by a specific Sui address
- **Response**: Array of articles owned by the address

- **Endpoint**: `GET /api/articles/public`
- **Description**: Get all publicly accessible articles
- **Response**: Array of public articles

- **Endpoint**: `GET /api/articles/ownership/:type?address=:address`
- **Description**: Get articles by ownership type (owned, public, all)
- **Parameters**: `type` (owned/public/all), `address` (required for 'owned' type)
- **Response**: Array of articles based on ownership criteria

- **Endpoint**: `GET /api/articles/status/:status`
- **Description**: Filter articles by upload status (pending, success, failed, local-only)
- **Response**: Array of articles with specified status

- **Endpoint**: `GET /api/articles/search?q=query`
- **Description**: Search articles by title, description, or tags
- **Response**: Array of matching articles

- **Endpoint**: `DELETE /api/articles/:id`
- **Description**: Delete article and associated files
- **Response**: Success/error message

#### **Database Statistics**
- **Endpoint**: `GET /api/stats`
- **Description**: Get database statistics and metrics
- **Response**: Database stats including total articles, size, categories, and upload status counts

### **Data Models**

#### **Article Object**
```typescript
interface Article {
  id: string;                    // Unique article identifier
  title: string;                 // Article title
  description: string;           // Article description
  category: string;              // Article category
  fileName: string;              // Original filename
  originalFileSize: number;      // Original file size in bytes
  uploadDate: string;            // ISO timestamp
  lastModified: string;          // Last modification timestamp
  version: string;               // Article version
  
  // Walrus storage information
  walrus: {
    blobId: string | null;       // Walrus blob ID
    objectId: string | null;     // Walrus object ID
    storageEpochs: number | null; // Storage duration in epochs
    isCertified: boolean;        // Whether blob is certified
    uploadStatus: 'pending' | 'success' | 'failed' | 'local-only';
    uploadDate: string | null;   // Walrus upload timestamp
    errorMessage?: string;       // Error message if upload failed
  };
  
  // Local storage information (fallback)
  local: {
    filePath: string | null;     // Local file path
    fileSize: number | null;     // Local file size
    isCompressed: boolean;       // Whether file is compressed
  };
  
  // Metadata for search and organization
  tags: string[];                // Searchable tags
  author?: string;               // Article author
}
```

#### **Upload Response**
```typescript
interface UploadResponse {
  success: boolean;
  message: string;
  article: Article;
}
```

#### **Health Check Response**
```typescript
interface HealthResponse {
  status: 'OK';
  timestamp: string;
  message: string;
  walrusStatus: string;
  suiNetwork: string;
}
```

## File Structure

```
medearn/
├── src/
│   └── server.ts          # Main server file
├── public/
│   └── index.html         # Web interface
├── uploads/               # Uploaded files (created automatically)
├── articles.json          # Article metadata (created automatically)
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Walrus Integration Status

⚠️ **Currently a placeholder** - The Walrus integration is planned but not yet implemented. The server currently:

- Accepts file uploads and stores them locally
- Maintains article metadata in JSON format
- Provides a foundation for Walrus integration

### Planned Walrus Features

- Decentralized file storage
- Content addressing and verification
- Distributed content delivery
- Blockchain-based content ownership

## 🧪 Testing the Backend API

### **Prerequisites**
- Backend server running on `http://localhost:3000`
- `curl` command available (or use Postman/Insomnia)

### **1. Health Check Test**
```bash
curl http://localhost:3000/api/health
```
**Expected Response**: Server status, Walrus configuration, and network info

### **2. File Upload Test**
```bash
# Create a test file
echo "This is a test file for MedEarn" > test-file.txt

# Upload with metadata
curl -X POST \
  -F "title=Test Article" \
  -F "description=Testing the upload API" \
  -F "category=test" \
  -F "content=@test-file.txt" \
  http://localhost:3000/api/upload
```
**Expected Response**: Upload success message and article metadata

### **3. Articles Retrieval Test**
```bash
# Get all articles
curl http://localhost:3000/api/articles

# Get articles by category
curl http://localhost:3000/api/articles/category/test

# Get specific article (replace ID with actual article ID)
curl http://localhost:3000/api/articles/ARTICLE_ID_HERE
```

## 💻 **TypeScript Examples for Frontend Developers**

### **Complete API Client Class**
```typescript
// api/medearn-client.ts
export class MedEarnClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  // Upload file with metadata
  async uploadFile(
    file: File, 
    metadata: { title: string; description?: string; category?: string }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('content', file);
    formData.append('title', metadata.title);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    
    if (metadata.category) {
      formData.append('category', metadata.category);
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Get all articles
  async getAllArticles(): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/articles`);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.status}`);
    }
    return response.json();
  }

  // Get articles preview (optimized for browsing)
  async getArticlesPreview(): Promise<Omit<Article, 'walrus' | 'local'>[]> {
    const response = await fetch(`${this.baseUrl}/api/articles/preview`);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles preview: ${response.status}`);
    }
    return response.json();
  }

  // Get article by ID
  async getArticleById(id: string): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/api/articles/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found');
      }
      throw new Error(`Failed to fetch article: ${response.status}`);
    }
    return response.json();
  }

  // Get articles by category
  async getArticlesByCategory(category: string): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/articles/category/${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles by category: ${response.status}`);
    }
    return response.json();
  }

  // Get articles by owner
  async getArticlesByOwner(suiAddress: string): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/articles/owner/${encodeURIComponent(suiAddress)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles by owner: ${response.status}`);
    }
    return response.json();
  }

  // Get public articles
  async getPublicArticles(): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/articles/public`);
    if (!response.ok) {
      throw new Error(`Failed to fetch public articles: ${response.status}`);
    }
    return response.json();
  }

  // Get articles by ownership type
  async getArticlesByOwnershipType(
    type: 'owned' | 'public' | 'all', 
    suiAddress?: string
  ): Promise<Article[]> {
    const url = new URL(`${this.baseUrl}/api/articles/ownership/${type}`);
    if (suiAddress) {
      url.searchParams.append('address', suiAddress);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch articles by ownership: ${response.status}`);
    }
    return response.json();
  }

  // Get articles by status
  async getArticlesByStatus(status: Article['walrus']['overallStatus']): Promise<Article[]> {
    const response = await fetch(`${this.baseUrl}/api/articles/status/${status}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles by status: ${response.status}`);
    }
    return response.json();
  }

  // Search articles
  async searchArticles(query: string): Promise<Article[]> {
    const url = new URL(`${this.baseUrl}/api/articles/search`);
    url.searchParams.append('q', query);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    return response.json();
  }

  // Delete article
  async deleteArticle(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/articles/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete article: ${response.status}`);
    }

    return response.json();
  }

  // Get database statistics
  async getStats(): Promise<DatabaseStats> {
    const response = await fetch(`${this.baseUrl}/api/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }
    return response.json();
  }
}

// Usage example
const medearnClient = new MedEarnClient('http://localhost:3000');
```

### **React Hooks for MedEarn API**
```typescript
// hooks/useMedEarn.ts
import { useState, useEffect, useCallback } from 'react';
import { MedEarnClient } from '../api/medearn-client';
import type { Article, UploadResponse, DatabaseStats } from '../types';

export const useMedEarn = (baseUrl?: string) => {
  const [client] = useState(() => new MedEarnClient(baseUrl));
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getAllArticles();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Upload file
  const uploadFile = useCallback(async (
    file: File, 
    metadata: { title: string; description?: string; category?: string }
  ): Promise<UploadResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.uploadFile(file, metadata);
      if (result.success) {
        // Refresh articles list after successful upload
        await fetchArticles();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, fetchArticles]);

  // Delete article
  const deleteArticle = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.deleteArticle(id);
      if (result.success) {
        // Remove article from local state
        setArticles(prev => prev.filter(article => article.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Search articles
  const searchArticles = useCallback(async (query: string): Promise<Article[]> => {
    setLoading(true);
    setError(null);
    try {
      const results = await client.searchArticles(query);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Get articles by category
  const getArticlesByCategory = useCallback(async (category: string): Promise<Article[]> => {
    setLoading(true);
    setError(null);
    try {
      const results = await client.getArticlesByCategory(category);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles by category');
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Get articles by owner
  const getArticlesByOwner = useCallback(async (suiAddress: string): Promise<Article[]> => {
    setLoading(true);
    setError(null);
    try {
      const results = await client.getArticlesByOwner(suiAddress);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles by owner');
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Get public articles
  const getPublicArticles = useCallback(async (): Promise<Article[]> => {
    setLoading(true);
    setError(null);
    try {
      const results = await client.getPublicArticles();
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch public articles');
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Get database stats
  const getStats = useCallback(async (): Promise<DatabaseStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await client.getStats();
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Load articles on mount
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    // State
    articles,
    loading,
    error,
    
    // Actions
    fetchArticles,
    uploadFile,
    deleteArticle,
    searchArticles,
    getArticlesByCategory,
    getArticlesByOwner,
    getPublicArticles,
    getStats,
    
    // Utilities
    clearError: () => setError(null)
  };
};
```

### **React Component Examples**
```typescript
// components/ArticleList.tsx
import React from 'react';
import { useMedEarn } from '../hooks/useMedEarn';
import type { Article } from '../types';

export const ArticleList: React.FC = () => {
  const { articles, loading, error, deleteArticle } = useMedEarn();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      const success = await deleteArticle(id);
      if (success) {
        console.log('Article deleted successfully');
      }
    }
  };

  if (loading) return <div>Loading articles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="article-list">
      {articles.map((article) => (
        <div key={article.id} className="article-item">
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <div className="article-meta">
            <span>Category: {article.category}</span>
            <span>Uploaded: {new Date(article.uploadDate).toLocaleDateString()}</span>
            <span>Status: {article.walrus?.overallStatus || 'local-only'}</span>
          </div>
          <button onClick={() => handleDelete(article.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

// components/FileUpload.tsx
import React, { useState } from 'react';
import { useMedEarn } from '../hooks/useMedEarn';

export const FileUpload: React.FC = () => {
  const { uploadFile, loading } = useMedEarn();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    try {
      const result = await uploadFile(file, { title, description, category });
      if (result.success) {
        alert('File uploaded successfully!');
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('general');
        setFile(null);
      }
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General</option>
          <option value="medical">Medical</option>
          <option value="research">Research</option>
          <option value="education">Education</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="file">File *</label>
        <input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};

// components/ArticleSearch.tsx
import React, { useState } from 'react';
import { useMedEarn } from '../hooks/useMedEarn';
import type { Article } from '../types';

export const ArticleSearch: React.FC = () => {
  const { searchArticles, loading } = useMedEarn();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const searchResults = await searchArticles(query);
    setResults(searchResults);
  };

  return (
    <div className="search-container">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {results.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({results.length})</h3>
          {results.map((article) => (
            <div key={article.id} className="search-result-item">
              <h4>{article.title}</h4>
              <p>{article.description}</p>
              <span>Category: {article.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### **TypeScript Type Definitions**
```typescript
// types/medearn.ts
export interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  fileName: string;
  originalFileSize: number;
  preview: string;
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
  
  // Local storage information
  local: {
    filePath: string | null;
    fileSize: number | null;
    isCompressed: boolean;
  };
  
  // Metadata
  tags: string[];
  author?: string;
  
  // Ownership information
  owner: {
    suiAddress: string;
    uploaderAddress: string;
    isPublic: boolean;
    transferable: boolean;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  article: Article;
}

export interface HealthResponse {
  status: 'OK';
  timestamp: string;
  message: string;
  walrusStatus: string;
  suiNetwork: string;
}

export interface DatabaseStats {
  totalArticles: number;
  totalSize: number;
  categories: Record<string, number>;
  uploadStatus: Record<string, number>;
  blobStatus: Record<string, number>;
  lastBackup: string;
}

// API Error types
export class MedEarnError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'MedEarnError';
  }
}

export class UploadError extends MedEarnError {
  constructor(message: string, status: number = 400) {
    super(message, status, 'UPLOAD_ERROR');
  }
}

export class ArticleNotFoundError extends MedEarnError {
  constructor(articleId: string) {
    super(`Article not found: ${articleId}`, 404, 'ARTICLE_NOT_FOUND');
  }
}
```

### **Error Handling and Validation**
```typescript
// utils/validation.ts
export const validateUploadMetadata = (metadata: {
  title: string;
  description?: string;
  category?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!metadata.title.trim()) {
    errors.push('Title is required');
  }

  if (metadata.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (metadata.description && metadata.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  const validCategories = ['general', 'medical', 'research', 'education', 'test'];
  if (metadata.category && !validCategories.includes(metadata.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  if (file.size === 0) {
    errors.push('File cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// utils/error-handling.ts
export const handleApiError = (error: unknown): string => {
  if (error instanceof MedEarnError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  if (error instanceof Error && error.message.includes('network')) {
    return true;
  }
  
  return false;
};
```

### **4. Frontend Integration Testing**

#### **JavaScript/TypeScript Example**
```typescript
// Health check
const checkHealth = async () => {
  const response = await fetch('http://localhost:3000/api/health');
  const health = await response.json();
  console.log('Server Status:', health);
};

// Upload file
const uploadFile = async (file: File, title: string, description: string, category: string) => {
  const formData = new FormData();
  formData.append('content', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
};

// Get articles
const getArticles = async () => {
  const response = await fetch('http://localhost:3000/api/articles');
  const articles = await response.json();
  return articles;
};

// Get articles by category
const getArticlesByCategory = async (category: string) => {
  const response = await fetch(`http://localhost:3000/api/articles/category/${category}`);
  const articles = await response.json();
  return articles;
};
```

#### **React Hook Example**
```typescript
import { useState, useEffect } from 'react';

const useMedEarnAPI = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file: File, metadata: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', file);
      formData.append('title', metadata.title);
      formData.append('description', metadata.description);
      formData.append('category', metadata.category);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh articles list
        fetchArticles();
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    const response = await fetch('http://localhost:3000/api/articles');
    const data = await response.json();
    setArticles(data);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return { articles, loading, uploadFile, fetchArticles };
};
```

### **5. Error Handling Examples**

#### **Upload Error Handling**
```typescript
const handleUpload = async (file: File) => {
  try {
    const result = await uploadFile(file, {
      title: 'My Article',
      description: 'Description',
      category: 'general'
    });
    
    if (result.success) {
      console.log('Upload successful:', result.article);
    } else {
      console.error('Upload failed:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### **Response Status Handling**
```typescript
const fetchArticles = async () => {
  const response = await fetch('http://localhost:3000/api/articles');
  
  if (response.ok) {
    const articles = await response.json();
    return articles;
  } else if (response.status === 404) {
    console.log('No articles found');
    return [];
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};
```

## 📱 Usage Examples

### **Basic Frontend Integration**
1. **Start the backend**: `npm run dev` (in backend directory)
2. **Test API endpoints**: Use the curl commands above
3. **Integrate with frontend**: Use the JavaScript/TypeScript examples
4. **Handle responses**: Implement proper error handling and loading states

### **Frontend Development Workflow**
1. **API Testing**: Test all endpoints with curl/Postman
2. **Integration**: Implement API calls in your frontend
3. **Error Handling**: Add proper error handling for network issues
4. **User Experience**: Add loading states and success/error messages
5. **Testing**: Test with different file types and edge cases

## File Upload Limits

- **Maximum file size**: 10MB
- **Supported formats**: All file types
- **Storage location**: Local `uploads/` directory

## 🔧 Development Notes

- The server automatically creates necessary directories (`uploads/`, `public/`)
- Article metadata is stored in `articles.json` for persistence
- File uploads include unique naming to prevent conflicts
- **CORS is enabled** for cross-origin requests from any frontend

### **Frontend Configuration**

#### **CORS Settings**
The backend has CORS enabled with:
```typescript
app.use(cors()); // Allows all origins
```

#### **Environment Variables for Frontend**
```bash
# Frontend .env file
REACT_APP_API_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000  # For Vite
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000  # For Next.js
```

#### **Frontend API Configuration**
```typescript
// config/api.ts
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  upload: `${API_BASE_URL}/api/upload`,
  articles: `${API_BASE_URL}/api/articles`,
  articleById: (id: string) => `${API_BASE_URL}/api/articles/${id}`,
  articlesByCategory: (category: string) => `${API_BASE_URL}/api/articles/category/${category}`,
};
```

## Future Enhancements

- [ ] Complete Walrus integration
- [ ] User authentication and authorization
- [ ] Content search and filtering
- [ ] File compression and optimization
- [ ] Content versioning
- [ ] API rate limiting
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Docker containerization

## 🚨 Troubleshooting Common Issues

### **Frontend Integration Problems**

#### **CORS Errors**
```bash
# Error: Access to fetch at 'http://localhost:3000/api/health' from origin 'http://localhost:3001' has been blocked by CORS policy
```
**Solution**: Backend CORS is already enabled. Check if backend is running on port 3000.

#### **File Upload Issues**
```bash
# Error: Failed to fetch
```
**Solutions**:
- Verify backend server is running: `curl http://localhost:3000/api/health`
- Check file size (max 10MB)
- Ensure all required fields are sent

#### **Network Errors**
```bash
# Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Start the backend server with `npm run dev`

### **Backend Issues**

#### **Port Already in Use**
```bash
# Error: EADDRINUSE: address already in use :::3000
```
**Solution**: 
```bash
# Find process using port 3000
lsof -ti:3000
# Kill the process
kill -9 <PID>
```

#### **Walrus Upload Failures**
```bash
# Message: "Content uploaded locally (Walrus upload failed)"
```
**Note**: This is expected in development. Files are stored locally as fallback.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Frontend Developer Contribution**
- Test all API endpoints before submitting
- Include error handling examples
- Document any new frontend patterns
- Test with different file types and sizes

## License

ISC License - see LICENSE file for details. 