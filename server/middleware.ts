import express from "express";
import { paymentMiddleware, Network } from "x402-express";
// import { facilitator } from "@coinbase/x402"; // For mainnet

const app = express();

app.use(
  paymentMiddleware(
    "0x4ca0d90fb63968fc4327f8dd6c8119fbd745e748c7916a531da273440835b4da", // your receiving wallet address
    {
      // Route configurations for protected endpoints
      "GET /api/upload": {
        // USDC amount in dollars
        price: "$0.001",
        network: "base-sepolia", // for mainnet, see Running on Mainnet section
        // Optional: Add metadata for better discovery in x402 Bazaar
        config: {
          description: "Upload a file to the server",
          inputSchema: {
            properties: {
              file: { type: "string", description: "File name" },
            },
          },
          outputSchema: {
            properties: {
              file: { type: "string" },
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

// Implement your route
app.get("/api/upload", (req, res) => {
  res.send({
    report: {
      file: "file.txt",
    },
  });
});

app.listen(3000, () => {
  console.log(`Server listening at http://localhost:3000`);
});
