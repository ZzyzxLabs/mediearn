import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import {
  WalrusClient,
  TESTNET_WALRUS_PACKAGE_CONFIG,
  WalrusFile,
} from "@mysten/walrus";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";
import dotenv from "dotenv";
import { BlobInfo, BlobStorage } from "./blobStorage";
// @ts-ignore - x402-express types are ESM but we're using CommonJS
import { paymentMiddleware } from "x402-express";

// Load environment variables
dotenv.config();

const blobStorage = new BlobStorage();

const app = express();
const PORT = process.env.PORT || 3000;

// Get Sui Private Key and Public Key from environment variables
const SUI_PRIVATE_KEY = process.env.SUI_PRIVATE_KEY;
const SUI_PUBLIC_KEY = process.env.SUI_PUBLIC_KEY;

// Create keypair from private key (trying different keypair types)
function createSuiKeypair(
  privateKeyString: string
): Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair | null {
  try {
    console.log("🔍 Creating keypair from private key...");
    console.log(
      `📝 Private key format: ${privateKeyString.substring(
        0,
        10
      )}...${privateKeyString.substring(privateKeyString.length - 10)}`
    );
    console.log(`📏 Private key length: ${privateKeyString.length}`);

    let keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;

    // Try different keypair types
    try {
      console.log("🔧 Trying Ed25519...");
      keypair = Ed25519Keypair.fromSecretKey(privateKeyString);
      console.log("✅ Ed25519 keypair created");
    } catch (ed25519Error) {
      try {
        console.log("🔧 Trying Secp256k1...");
        keypair = Secp256k1Keypair.fromSecretKey(privateKeyString);
        console.log("✅ Secp256k1 keypair created");
      } catch (secp256k1Error) {
        try {
          console.log("🔧 Trying Secp256r1...");
          keypair = Secp256r1Keypair.fromSecretKey(privateKeyString);
          console.log("✅ Secp256r1 keypair created");
        } catch (secp256r1Error) {
          throw new Error("Failed to create keypair with any type");
        }
      }
    }

    // console log the public key
    console.log(`📝 Public key: ${keypair.toSuiAddress()}`);

    console.log(
      `✅ Keypair created successfully, derived address: ${keypair.toSuiAddress()}`
    );
    return keypair;
  } catch (error) {
    console.error("❌ Error creating Sui keypair:", error);
    return null;
  }
}

// Initialize Sui client for testnet
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

// Initialize Walrus client with testnet configuration and Sui client
const walrusClient = new WalrusClient({
  suiClient,
  network: "testnet",
});

// Create Sui keypair
if (!SUI_PRIVATE_KEY || !SUI_PUBLIC_KEY) {
  console.log(
    "❌ Both SUI_PRIVATE_KEY and SUI_PUBLIC_KEY environment variables must be set - Walrus uploads will fail"
  );
  console.log("📝 Please add both to your .env file");
}

const keypair = SUI_PRIVATE_KEY ? createSuiKeypair(SUI_PRIVATE_KEY) : null;

if (keypair) {
  console.log("✅ Sui keypair created successfully");
  console.log(`📍 Public Key: ${SUI_PUBLIC_KEY}`);

  // Verify the public key matches
  const derivedPublicKey = keypair.toSuiAddress();
  if (derivedPublicKey !== SUI_PUBLIC_KEY) {
    console.log(
      `⚠️ Warning: Derived public key (${derivedPublicKey}) doesn't match provided public key (${SUI_PUBLIC_KEY})`
    );
    console.log("This might cause issues with Walrus operations");
  }
} else {
  console.log("❌ Failed to create Sui keypair - Walrus uploads will fail");
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// x402 Payment Protocol - automatically handles HTTP 402 and payment verification
// This must be applied BEFORE the routes to intercept requests
console.log("🔧 Setting up x402 payment middleware...");

app.use(
  paymentMiddleware(
    process.env.RESOURCE_WALLET_ADDRESS ||
      "0x4ca0d90fb63968fc4327f8dd6c8119fbd745e748c7916a531da273440835b4da", // Your receiving wallet
    {
      "GET /api/test-payment": {
        // USDC amount in dollars
        price: "$0.01",
        network: "base-sepolia", // for mainnet, see Running on Mainnet section
        // Optional: Add metadata for better discovery in x402 Bazaar
        config: {
          description: "Test payment endpoint",
          inputSchema: {},
          outputSchema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      "GET /api/blobs/*/content": {
        // USDC amount in dollars
        price: "$0.01",
        network: "base-sepolia", // for mainnet, see Running on Mainnet section
        // Optional: Add metadata for better discovery in x402 Bazaar
        config: {
          description: "Access premium article content",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Article blob ID" },
              userAddress: {
                type: "string",
                description: "User wallet address",
              },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              blobId: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              metadata: { type: "object" },
            },
          },
        },
      },
      "DELETE /api/blobs/:id": {
        // USDC amount in dollars
        price: "$0.01",
        network: "base-sepolia", // for mainnet, see Running on Mainnet section
        // Optional: Add metadata for better discovery in x402 Bazaar
        config: {
          description: "Delete article content (owner only)",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Article blob ID to delete" },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    {
      url: "https://x402.org/facilitator", // for testnet
    }
  )
);

console.log("✅ x402 payment middleware configured successfully");

// Test route to verify x402 middleware
app.get("/api/test-payment", (req, res) => {
  console.log("🔍 Test payment route accessed");
  res.json({ message: "This route should require payment" });
});

// Routes

// Upload content to Walrus and store blob info
app.post("/api/upload", async (req, res) => {
  try {
    const { title, description = "", content, ownerAddress } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Both title and content are required" });
    }

    if (!ownerAddress) {
      return res.status(400).json({ error: "ownerAddress is required" });
    }

    // Upload to Walrus
    if (!keypair) {
      throw new Error(
        "Private key not properly configured - cannot upload to Walrus"
      );
    }

    console.log("Uploading to Walrus...");
    const fileBuffer = new Uint8Array(Buffer.from(content, "utf8"));

    // Check WAL balance first
    try {
      const walletAddress = ownerAddress;
      console.log("🔍 Checking WAL token balance...");
      console.log(`📍 Wallet Address: ${walletAddress}`);
      console.log(`🌐 Network: testnet`);
      console.log(
        `🪙 WAL Token Contract: 0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`
      );

      const coins = await suiClient.getCoins({
        owner: walletAddress,
        coinType:
          "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
      });

      console.log(`📊 Raw coins response:`, JSON.stringify(coins, null, 2));

      const totalBalance = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        BigInt(0)
      );
      console.log(`💰 Current WAL Balance: ${totalBalance} WAL`);

      if (totalBalance === BigInt(0)) {
        console.log(
          "❌ No WAL tokens found. You need to get WAL tokens first."
        );
        console.log(
          "💡 Try: https://suiexplorer.com/faucet or swap SUI for WAL on testnet"
        );
      }
    } catch (balanceError) {
      console.log("⚠️ Could not check WAL balance:", balanceError);
    }

    let blobInfo: BlobInfo;

    try {
      // Create preview text for local storage
      const previewText = `${title}\n\n${description}`;

      let contentBlobId: string;

      console.log("🔄 Uploading content to Walrus...");

      try {
        console.log(
          "🔄 Uploading article content to Walrus using writeFiles..."
        );

        // Log storage requirements
        const totalBytes = fileBuffer.byteLength;
        const epochs = 1; // Set to 1 to make storage as cheap as possible
        console.log(`📊 Storage Requirements:`);
        console.log(`   - Article content: ${totalBytes} bytes`);
        console.log(`   - Storage duration: ${epochs} epochs`);
        console.log(
          `   - Estimated WAL cost: ${
            (totalBytes * epochs) / 1000000
          } WAL (rough estimate)`
        );

        // Create WalrusFile object for the entire article content
        const contentFile = WalrusFile.from({
          contents: fileBuffer,
          identifier: "README.md",
          tags: {
            "content-type": "text/plain",
          },
        });

        const results = await walrusClient.writeFiles({
          files: [contentFile],
          deletable: true,
          epochs: 1, // Set to 1 to make storage as cheap as possible
          signer: keypair as any,
        });

        // Handle the results array properly
        const contentResult = Array.isArray(results) ? results[0] : results;

        console.log(
          "✅ Article content uploaded successfully to Walrus:",
          contentResult
        );

        // Extract blob ID from the result
        if (!contentResult?.blobId) {
          throw new Error(
            "Walrus upload failed: Missing blob ID from response"
          );
        }

        contentBlobId = contentResult.blobId;

        console.log("🔍 Extracted blob ID:", contentBlobId);
      } catch (writeError) {
        console.error("⚠️ writeFiles failed with error:", writeError);
        throw new Error(
          `Walrus upload failed: ${
            writeError instanceof Error ? writeError.message : "Unknown error"
          }`
        );
      }

      // Create blob info with preview text stored locally and content blob ID from Walrus
      blobInfo = blobStorage.createBlob(
        {
          title: title,
          ownerAddress: ownerAddress,
          isPublic: false, // All articles are payment-gated
          previewText: previewText, // Store preview text locally
          accessControl: {
            type: "payment-gated",
            paymentDetails: {
              price: "0.01",
              currency: "USDC",
              paymentAddress: ownerAddress,
              assetAddress: "0xA0b86991C6218b36c1d19D4a2e9Eb0cE3606EB48",
              network: "base-testnet",
            },
          },
          walrus: {
            contentBlob: {
              blobId: contentBlobId,
              storageEpochs: 1,
              isCertified: true,
              uploadStatus: "success",
              uploadDate: new Date().toISOString(),
            },
            overallStatus: "success",
          },
        },
        contentBlobId
      );
    } catch (walrusError) {
      console.error("❌ Walrus upload failed:", walrusError);

      // Return error response instead of creating local blob
      return res.status(500).json({
        success: false,
        error: "Walrus upload failed",
        message: "Failed to upload content to decentralized storage",
        details:
          walrusError instanceof Error ? walrusError.message : "Unknown error",
      });
    }

    // Only reach here if Walrus upload was successful
    res.json({
      success: true,
      message:
        "Article uploaded successfully to Walrus with local preview storage",
      blobInfo: blobInfo,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload content" });
  }
});

// Get all blob previews from local storage
app.get("/api/blobs/preview", (req, res) => {
  try {
    const blobs = blobStorage.getAllBlobs().filter((blob) => blob.previewText);

    if (blobs.length === 0) {
      return res.json([]);
    }

    // Return preview information with payment details for each blob
    const previewsWithContent = blobs.map((blob) => {
      const title = blob.previewText?.split("\n\n")[0] || "";
      const description = blob.previewText?.split("\n\n")[1] || "";
      return {
        blobId: blob.id,
        title: title,
        description: description,
        ownerAddress: blob.ownerAddress,
        uploadDate: blob.uploadDate,
        paymentRequired: true, // All articles require payment
        paymentDetails: {
          price: blob.accessControl.paymentDetails.price,
          currency: blob.accessControl.paymentDetails.currency,
          network: blob.accessControl.paymentDetails.network,
        },
      };
    });

    res.json(previewsWithContent);
  } catch (error) {
    console.error("Error reading blob previews:", error);
    res.status(500).json({ error: "Failed to fetch blob previews" });
  }
});

// Content endpoint - now protected by x402 middleware
app.get("/api/blobs/:id/content", async (req, res) => {
  console.log("🔍 Content endpoint accessed:", {
    id: req.params.id,
    userAddress: req.query.userAddress,
    method: req.method,
    url: req.url,
    headers: req.headers,
  });

  try {
    const { id } = req.params;
    const userAddress = req.query.userAddress as string;

    if (!userAddress) {
      return res.status(400).json({
        error: "userAddress query parameter is required",
        message: "Please provide userAddress to access content",
      });
    }

    const blob = blobStorage.getBlob(id);
    if (!blob) {
      return res.status(404).json({ error: "Blob not found" });
    }

    if (!blob.walrus?.contentBlob?.blobId) {
      return res
        .status(404)
        .json({ error: "Content not available for this blob" });
    }

    console.log("✅ Payment middleware bypassed - content access granted");

    // If we reach here, payment has been verified by x402 middleware
    // Fetch content from Walrus
    try {
      const blobData = await walrusClient.getBlob({
        blobId: blob.walrus.contentBlob.blobId,
      });
      if (!blobData) {
        return res
          .status(404)
          .json({ error: "No blob data returned from Walrus" });
      }
      const files = await blobData.files({ identifiers: ["README.md"] });
      if (!files || files.length === 0) {
        return res.status(404).json({ error: "No files returned from Walrus" });
      }
      const file = files[0];
      const processedContent = await file.text();

      // Record payment access
      const paymentId = `pay_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      blobStorage.recordPayment(
        id,
        userAddress,
        paymentId,
        blob.accessControl.paymentDetails.price
      );

      res.json({
        blobId: id,
        title: blob.title,
        content: processedContent,
        metadata: {
          uploadDate: blob.uploadDate,
          ownerAddress: blob.ownerAddress,
          isPublic: blob.isPublic,
          paymentInfo: blobStorage.getPaymentInfo(id, userAddress),
        },
      });
    } catch (walrusError) {
      console.error("Error fetching content from Walrus:", walrusError);
      res.status(500).json({
        error: "Failed to fetch content from Walrus",
        details:
          walrusError instanceof Error ? walrusError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error reading blob content:", error);
    res.status(500).json({ error: "Failed to fetch blob content" });
  }
});

// Remove the old manual payment endpoint since x402 middleware handles it
// app.post('/api/blobs/:id/pay', ...) - REMOVED

// Delete blob
app.delete("/api/blobs/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = blobStorage.deleteBlob(id);

    if (success) {
      res.json({ success: true, message: "Blob deleted successfully" });
    } else {
      res.status(404).json({ error: "Blob not found" });
    }
  } catch (error) {
    console.error("Error deleting blob:", error);
    res.status(500).json({ error: "Failed to delete blob" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const stats = blobStorage.getStats();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "MedEarn server running with Walrus integration",
    walrusStatus: keypair
      ? "Private key configured"
      : "Private key parsing needed",
    suiNetwork: "testnet",
    database: {
      totalBlobs: stats.totalBlobs,
      lastUpdated: stats.lastUpdated,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MedEarn server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`📚 Blobs endpoint: http://localhost:${PORT}/api/blobs`);
  console.log(`👀 Blobs preview: http://localhost:${PORT}/api/blobs/preview`);
  console.log(
    `🔍 Search endpoint: http://localhost:${PORT}/api/blobs/search?q=query`
  );
  console.log(
    `👤 Ownership endpoints: http://localhost:${PORT}/api/blobs/owner/:address`
  );
  console.log(`🌍 Public blobs: http://localhost:${PORT}/api/blobs/public`);
  console.log(`📈 Stats endpoint: http://localhost:${PORT}/api/stats`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
  console.log(
    `🔑 Walrus Status: ${
      keypair ? "Private key configured" : "Private key parsing needed"
    }`
  );
  console.log(`💾 Database: ${blobStorage.getStats().totalBlobs} blobs loaded`);
  console.log(
    `📝 Note: Add proper Sui private key parsing to enable full Walrus functionality`
  );
});
