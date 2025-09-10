# MedEarn

A decentralized content monetization platform that allows authors to publish articles on Walrus storage and monetize them through x402 payment protocol.

## 🌟 Features

- **Decentralized Storage**: Articles stored on Walrus (Sui blockchain)
- **Content Encryption**: AES-256 encryption for secure content storage
- **Payment Integration**: x402 protocol for seamless crypto payments
- **Preview System**: Users can preview content before purchasing
- **ENS Integration**: Support for Ethereum Name Service (ENS) names
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

### Frontend (`/frontend`)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Wagmi** for wallet integration
- **x402-fetch** for payment handling

### Backend (`/server`)
- **Express.js** REST API
- **Walrus Client** for decentralized storage
- **AES-256** content encryption
- **x402-express** payment middleware
- **Sui blockchain** integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Sui wallet with testnet WAL tokens
- Ethereum wallet (for ENS support)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mediearn
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../server
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in `/server`:
   ```env
   PORT=8000
   SUI_PRIVATE_KEY=your_sui_private_key
   SUI_PUBLIC_KEY=your_sui_public_key
   AES_SECRET=your_32_byte_hex_secret
   RESOURCE_WALLET_ADDRESS=your_receiving_wallet_address
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 📖 Usage

### For Authors

1. **Connect Wallet**: Connect your Ethereum wallet
2. **Upload Article**: 
   - Go to `/upload`
   - Enter title, description, and content
   - Upload to Walrus storage
3. **Monetize**: Set price (default: $0.01 USDC)

### For Readers

1. **Browse Articles**: View available articles on homepage
2. **Preview Content**: Click article to see preview
3. **Purchase Access**: Pay with crypto to read full content
4. **Read Article**: Access full content after payment

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/blobs/preview` - List all article previews
- `GET /api/blobs/:id/preview` - Get article preview (no payment)

### Payment-Protected Endpoints
- `GET /api/blobs/:id/content` - Get full article content (requires payment)
- `DELETE /api/blobs/:id` - Delete article (owner only)

### Upload Endpoint
- `POST /api/upload` - Upload new article

## 💰 Payment Flow

1. **Preview**: Users see article preview without payment
2. **Payment**: x402 protocol handles crypto payment
3. **Access**: Full content unlocked after successful payment
4. **Storage**: Content stored securely on Walrus with encryption

## 🔐 Security Features

- **Content Encryption**: AES-256 encryption for all stored content
- **Payment Verification**: x402 middleware validates payments
- **Access Control**: Only paid users can access full content
- **Wallet Integration**: Secure wallet connection via Wagmi

## 🌐 Supported Networks

- **Sui Testnet**: For Walrus storage
- **Base Sepolia**: For x402 payments (testnet)
- **Ethereum Mainnet**: For ENS name resolution

## 🛠️ Development

### Project Structure
```
mediearn/
├── frontend/           # Next.js frontend
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/ # React components
│   │   └── lib/       # Utilities and API client
├── server/            # Express.js backend
│   ├── src/
│   │   ├── server.ts  # Main server file
│   │   └── blobStorage.ts # Storage management
└── README.md
```

### Key Technologies

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Wagmi (Web3)
- x402-fetch

**Backend:**
- Express.js
- TypeScript
- Walrus Client
- x402-express
- AES encryption

## 📝 Content Format

Articles are stored in the following format:
```
Title

Description

Content Preview (first 200 characters)
```

## 🔍 Debugging

### Frontend Debug Page
Visit `/debug` to:
- Check localStorage status
- Test content store
- Verify navigation
- View browser information

### Server Logs
The server provides detailed logging for:
- Preview content processing
- Payment verification
- Walrus operations
- Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the debug page (`/debug`)
2. Review server logs
3. Open an issue on GitHub

## 🔮 Future Enhancements

- [ ] Support for multiple payment tokens
- [ ] Content categories and tags
- [ ] Author profiles and reputation
- [ ] Social features (likes, comments)
- [ ] Mobile app
- [ ] Advanced search and filtering
- [ ] Subscription models
- [ ] Content recommendations

---

Built with ❤️ for the decentralized web