"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ArticlePreview {
  blobId: string;
  previewText: string;
}

interface ArticleContent {
  blobId: string;
  title: string;
  content: string;
  metadata: {
    uploadDate: string;
    ownerAddress: string;
    isPublic: boolean;
  };
}

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
      const response = await fetch("http://localhost:8000/api/blobs/preview");
      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }
      const data = await response.json();
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

      const response = await fetch(
        `http://localhost:8000/api/blobs/${blobId}/content`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch article content");
      }

      const data = await response.json();
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

  // Parse preview text to extract title and description
  const parsePreviewText = (previewText: string) => {
    const lines = previewText.split("\n");
    const title = lines[0] || "Untitled";
    const description = lines.slice(2).join("\n").trim();

    // Only return description if it exists and is not empty
    return {
      title,
      description:
        description && description.length > 0
          ? description.substring(0, 150) +
            (description.length > 150 ? "..." : "")
          : null,
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='flex items-center space-x-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading articles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-destructive mb-4'>{error}</p>
          <Button onClick={fetchArticles}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Article detail view
  if (selectedArticle) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8 max-w-4xl'>
          {/* Back button */}
          <Button
            variant='ghost'
            onClick={() => setSelectedArticle(null)}
            className='mb-6'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Articles
          </Button>

          {/* Article content */}
          <Card>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='text-3xl mb-2'>
                    {selectedArticle.title}
                  </CardTitle>
                  <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
                    <div className='flex items-center'>
                      <User className='h-4 w-4 mr-1' />
                      {formatAddress(selectedArticle.metadata.ownerAddress)}
                    </div>
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 mr-1' />
                      {formatDate(selectedArticle.metadata.uploadDate)}
                    </div>
                    <Badge
                      variant={
                        selectedArticle.metadata.isPublic
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedArticle.metadata.isPublic ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
                <Badge variant='outline' className='flex items-center'>
                  <ExternalLink className='h-3 w-3 mr-1' />
                  Walrus Storage
                </Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className='pt-6'>
              {loadingContent ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin mr-2' />
                  Loading content from Walrus...
                </div>
              ) : error ? (
                <div className='text-center py-8'>
                  <div className='text-destructive mb-4'>
                    <p className='font-semibold'>Full Content Unavailable</p>
                    <p className='text-sm'>{error}</p>
                    <p className='text-sm text-muted-foreground mt-2'>
                      This might be due to Walrus storage issues. Showing
                      preview instead.
                    </p>
                  </div>
                  <div className='mt-6 p-4 bg-muted rounded-lg'>
                    <h4 className='font-semibold mb-2'>Preview:</h4>
                    <pre className='whitespace-pre-wrap font-sans text-sm leading-relaxed'>
                      {articles.find((a) => a.blobId === selectedArticle.blobId)
                        ?.previewText || "No preview available"}
                    </pre>
                  </div>
                  <Button
                    variant='outline'
                    onClick={() => fetchArticleContent(selectedArticle.blobId)}
                    className='mt-4'
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className='prose prose-lg max-w-none'>
                  <pre className='whitespace-pre-wrap font-sans text-base leading-relaxed'>
                    {selectedArticle.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Article list view
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>MedEarn Articles</h1>
          <p className='text-muted-foreground'>
            Discover articles stored on decentralized Walrus storage
          </p>
        </div>

        {/* Upload button */}
        <div className='mb-8'>
          <Link href='/upload'>
            <Button>
              <FileText className='h-4 w-4 mr-2' />
              Upload New Article
            </Button>
          </Link>
        </div>

        {/* Articles grid */}
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
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {articles.map((article) => {
              const { title, description } = parsePreviewText(
                article.previewText
              );
              return (
                <Card
                  key={article.blobId}
                  className='cursor-pointer hover:shadow-lg transition-shadow'
                  onClick={() => fetchArticleContent(article.blobId)}
                >
                  <CardHeader>
                    <CardTitle className='line-clamp-2'>{title}</CardTitle>
                    {description && (
                      <CardDescription className='line-clamp-3'>
                        {description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between'>
                      <Badge variant='outline' className='flex items-center'>
                        <ExternalLink className='h-3 w-3 mr-1' />
                        Walrus
                      </Badge>
                      <Button variant='ghost' size='sm'>
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
