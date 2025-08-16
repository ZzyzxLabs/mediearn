"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { ArticleCard } from "@/components/articleCard";
import { ArticleDetailCard } from "@/components/articleDetailCard";
import { apiClient, ArticlePreview, ArticleContent } from "@/lib/api";

export default function HomePage() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleContent | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null); // Clear any previous errors

      // Get user's address from web3 (you'll need to implement this)
      const userAddress = "0x1234...5678"; // Mock address for now

      const data = await apiClient.getBlobContent(blobId, userAddress);
      if (data) {
        setSelectedArticle(data);
      } else {
        throw new Error("Failed to fetch article content");
      }
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
        onBack={() => setSelectedArticle(null)}
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
                    onClick={fetchArticleContent}
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
