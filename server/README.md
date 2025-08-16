# MedEarn - Content Management Server

A TypeScript-based server for managing content uploads and serving articles, with integration for the Walrus decentralized storage system.

## Features

- **File Upload Management**: Handle file uploads with metadata
- **String Content Upload**: Upload text content directly without files
- **Article Storage**: Store and retrieve article metadata with automatic backup
- **RESTful API**: Clean API endpoints for content management
- **Web Interface**: Modern, responsive web UI for content management
- **Walrus Integration**: Decentralized storage with local fallback
- **Ownership System**: Track article ownership using Sui blockchain addresses

## Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **File Handling**: Multer for multipart file uploads
- **Storage**: Local file system + JSON metadata storage + Walrus decentralized storage
- **Frontend**: Vanilla HTML/CSS/JavaScript with modern UI
- **Blockchain**: Sui blockchain integration for ownership and decentralized storage

## Quick Start

1. **Clone and install:**
```bash
git clone <repository-url>
cd medearn
npm install
```

2. **Create `.env` file:**
```bash
# Sui Private Key (Base64 encoded)
SUI_PRIVATE_KEY="your_sui_private_key_here"

# Server Configuration
PORT=8000
NODE_ENV=development
```

3. **Build and run:**
```bash
npm run build
npm start
```

**For development with auto-reload:**
```bash
npm run dev
```

## 🚀 API Reference

### **Base URL**: `http://localhost:8000`

### **Core Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status and Walrus configuration |
| `POST` | `/api/upload` | Upload file with metadata (multipart/form-data) |
| `POST` | `/api/upload/string` | Upload text content (JSON) |
| `GET` | `/api/articles` | Get all articles with full details |
| `GET` | `/api/articles/preview` | Get articles for browsing (optimized) |
| `GET` | `/api/articles/:id` | Get specific article by ID |
| `GET` | `/api/articles/search?q=query` | Search articles |
| `GET` | `/api/articles/owner/:address` | Get articles by owner address |
| `GET` | `/api/articles/public` | Get public articles |
| `GET` | `/api/stats` | Database statistics |
| `DELETE` | `/api/articles/:id` | Delete article |

### **Data Models**

#### **Article Object**
```typescript
interface Article {
  id: string;
  fileName: string;
  originalFileSize: number;
  uploadDate: string;
  lastModified: string;
  version: string;
  
  // Walrus storage information
  walrus: {
    previewBlob: { /* blob details */ };
    contentBlob: { /* blob details */ };
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
    isPublic: boolean;
    transferable: boolean;
  };
}
```

## 🧪 Testing Examples

### **Health Check**
```bash
curl http://localhost:8000/api/health
```

### **File Upload**
```bash
curl -X POST \
  -F "title=Test Article" \
  -F "description=Testing the upload API" \
  -F "category=test" \
  -F "content=@test-file.txt" \
  http://localhost:8000/api/upload
```

### **String Content Upload**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test String Article",
    "content": "This is test content",
    "fileName": "test-string.txt",
    "description": "Testing string upload",
    "category": "test"
  }' \
  http://localhost:8000/api/upload/string
```

### **Get Articles**
```bash
# All articles
curl http://localhost:8000/api/articles

# Articles preview
curl http://localhost:8000/api/articles/preview

# Search articles
curl "http://localhost:8000/api/articles/search?q=test"

# Articles by owner
curl http://localhost:8000/api/articles/owner/SUI_ADDRESS_HERE
```

## 💻 **Frontend Integration**

### **Basic API Client**
```typescript
class MedEarnClient {
  constructor(private baseUrl: string = 'http://localhost:8000') {}

  async uploadFile(file: File, metadata: { title: string; description?: string; category?: string }) {
    const formData = new FormData();
    formData.append('content', file);
    formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }

  async uploadString(content: string, metadata: { title: string; fileName: string; description?: string; category?: string }) {
    const response = await fetch(`${this.baseUrl}/api/upload/string`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, ...metadata })
    });
    return response.json();
  }

  async getArticles() {
    const response = await fetch(`${this.baseUrl}/api/articles`);
    return response.json();
  }

  async searchArticles(query: string) {
    const response = await fetch(`${this.baseUrl}/api/articles/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }
}

// Usage
const client = new MedEarnClient();
```

### **React Hook Example**
```typescript
import { useState, useEffect } from 'react';

const useMedEarn = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file: File, metadata: any) => {
    setLoading(true);
    try {
      const result = await client.uploadFile(file, metadata);
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
    const data = await client.getArticles();
    setArticles(data);
  };

  useEffect(() => { fetchArticles(); }, []);

  return { articles, loading, uploadFile, fetchArticles };
};
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Required
SUI_PRIVATE_KEY="your_sui_private_key_here"

# Optional
PORT=8000
NODE_ENV=development
```

### **File Upload Limits**
- **Maximum file size**: 10MB
- **Supported formats**: All file types
- **Storage**: Local + Walrus decentralized storage
- **String content**: Unlimited via `/api/upload/string`

## 📁 File Structure

```
medearn/
├── src/
│   ├── server.ts          # Main server file
│   └── database.ts        # Database and Article interface
├── public/                # Web interface
├── uploads/               # Uploaded files
├── data/                  # Database files
│   ├── articles.json      # Article metadata
│   └── backup/            # Database backups
├── .env                   # Environment variables (not in git)
└── package.json
```

## 🚨 Troubleshooting

### **Common Issues**

| Problem | Solution |
|---------|----------|
| **CORS Errors** | Backend CORS is enabled. Check if server is running on port 8000 |
| **Port in Use** | `lsof -ti:8000` then `kill -9 <PID>` |
| **Upload Fails** | Check file size (max 10MB) and required fields |
| **Walrus Errors** | Expected when unavailable. Files stored locally as fallback |
| **Missing Private Key** | Ensure `SUI_PRIVATE_KEY` is set in `.env` file |

### **Quick Debug Commands**
```bash
# Check server health
curl http://localhost:8000/api/health

# Verify server is running
lsof -i:8000

# Check environment variables
cat .env
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test all API endpoints
5. Submit a pull request

## License

ISC License - see LICENSE file for details. 