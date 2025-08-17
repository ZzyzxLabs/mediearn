"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { apiClient, ArticlePreview, ArticleContent } from "@/lib/api";
import { ArticleCard } from "@/components/articleCard";
import { ArticleDetailCard } from "@/components/articleDetailCard";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { useAccount } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { createClient } from "viem";

export default function HomePage() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleContent | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected, connector, chainId } = useAccount();

  const config = createConfig({
    chains: [base, baseSepolia],
    client({ chain }) {
      return createClient({ chain, transport: http() });
    },
  });

  // Fetch all article previews
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBlobPreviews();
      setArticles(data);
    } catch (error) {
      setError("Failed to load articles");
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch full article content
  const fetchArticleContent = async (blobId: string) => {
    try {
      setLoadingContent(true);
      setError(null);

      // Check if wallet is connected
      if (!isConnected || !address) {
        throw new Error("Please connect your wallet first");
      }

      console.log("Fetching article content with payment...", {
        blobId,
        userAddress: address,
      });

      const walletClient = await getWalletClient(config, {
        account: address,
        chainId: chainId,
        connector: connector,
      });

      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      console.log("walletClient", walletClient);

      // For x402-fetch, we need to pass the wallet client
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1]
      );

      // Make the request with payment handling
      const response = await fetchWithPayment(
        `http://localhost:8000/api/blobs/${blobId}/content?userAddress=${address}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Content response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch article content");
      }

      const data = await response.json();

      // Decode payment response if present
      const paymentResponseHeader = response.headers.get("x-payment-response");
      if (paymentResponseHeader) {
        try {
          const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
          console.log("Payment response for content access:", paymentResponse);
        } catch (paymentError) {
          console.error("Error decoding payment response:", paymentError);
        }
      }

      setSelectedArticle(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load article content";
      setError(errorMessage);
      console.error("Error fetching article content:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex items-center space-x-3'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading articles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={fetchArticles}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Article detail view
  if (selectedArticle) {
    return (
      <ArticleDetailCard
        article={selectedArticle}
        onBackAction={() => setSelectedArticle(null)}
        loading={loadingContent}
        error={error}
        onRetry={() => fetchArticleContent(selectedArticle.blobId)}
      />
    );
  }

  // Article list view
  return (
    <div className='min-h-screen'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>Articles</h1>
          <p className='text-muted-foreground mt-3'>
            Discover articles stored on decentralized Walrus storage
          </p>
        </div>

        {/* Articles grid */}
        <div className='flex justify-center'>
          <div className='w-2/3'>
            {articles.length === 0 ? (
              <div className='text-center py-12'>
                <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No articles yet</h3>
                <p className='text-muted-foreground mb-4'>
                  Be the first to upload an article to Walrus storage!
                </p>
                <Link href='/upload'>
                  <Button>Upload First Article</Button>
                </Link>
              </div>
            ) : (
              <div className='grid gap-6'>
                {articles.map((article) => (
                  <ArticleCard
                    key={article.blobId}
                    blobId={article.blobId}
                    previewText={`${article.title}\n\n${article.description}`}
                    onClickAction={fetchArticleContent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
