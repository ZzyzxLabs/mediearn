"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, User, Calendar, CheckCircle } from "lucide-react";
import { ArticleContent } from "@/lib/api";
import { contentStore } from "@/lib/contentStore";
import MarkdownViewer from "@/components/MarkdownViewer";

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [article, setArticle] = useState<ArticleContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const blobId = params.id as string;

    useEffect(() => {
        console.log("ArticleDetailPage: useEffect triggered", { blobId });

        // Try to get article content from multiple sources in order of preference
        let articleData: ArticleContent | null = null;

        // Primary: Check content store (in-memory)
        const storeContent = contentStore.getContent(blobId);
        if (storeContent) {
            console.log("ArticleDetailPage: Content found in content store", storeContent);
            articleData = storeContent;
        } else {
            console.log("ArticleDetailPage: No content in content store");
        }

        // Secondary: Check localStorage
        if (!articleData) {
            const tempContent = localStorage.getItem('tempArticleContent');
            console.log("ArticleDetailPage: localStorage content found:", !!tempContent);

            if (tempContent) {
                try {
                    const parsedContent = JSON.parse(tempContent);
                    console.log("ArticleDetailPage: Content parsed from localStorage successfully", parsedContent);
                    articleData = parsedContent;
                    // Clear the temporary storage
                    localStorage.removeItem('tempArticleContent');
                    console.log("ArticleDetailPage: localStorage cleared");
                } catch (error) {
                    console.error('ArticleDetailPage: Error parsing localStorage content:', error);
                }
            }
        }

        // Tertiary: Check URL parameters
        if (!articleData) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlContent = urlParams.get('content');
            console.log("ArticleDetailPage: URL content found:", !!urlContent);

            if (urlContent) {
                try {
                    const parsedContent = JSON.parse(decodeURIComponent(urlContent));
                    console.log("ArticleDetailPage: Content parsed from URL successfully", parsedContent);
                    articleData = parsedContent;
                    // Clean up URL
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                    console.log("ArticleDetailPage: URL cleaned up");
                } catch (error) {
                    console.error('ArticleDetailPage: Error parsing URL content:', error);
                }
            }
        }

        if (articleData) {
            setArticle(articleData);
            setLoading(false);
        } else {
            // If no content found, show error
            console.log("ArticleDetailPage: No content found in any source");
            setError('Article content not found. Please access this article through the preview page.');
            setLoading(false);
        }
    }, [blobId]);

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
                    <span>Loading article...</span>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-center max-w-md'>
                    <h2 className='text-xl font-semibold text-red-600 mb-4'>Article Content Not Found</h2>
                    <p className='text-gray-600 mb-6'>
                        {error || "The article content could not be loaded. This usually happens when:"}
                    </p>
                    <ul className='text-left text-sm text-gray-600 mb-6 space-y-2'>
                        <li>• You accessed this page directly without going through the preview</li>
                        <li>• The payment process didn't complete successfully</li>
                        <li>• There was a temporary issue with content transfer</li>
                    </ul>
                    <div className='space-y-3'>
                        <Button onClick={() => router.push('/')} className='w-full'>
                            Back to Articles
                        </Button>
                        <Button
                            variant='outline'
                            onClick={() => router.push(`/preview/${blobId}`)}
                            className='w-full'
                        >
                            Go to Preview Page
                        </Button>
                        <Button
                            variant='ghost'
                            onClick={() => window.location.reload()}
                            className='w-full'
                        >
                            Try Again
                        </Button>
                    </div>
                    <div className='mt-6 text-xs text-gray-500'>
                        <p>Debug Info: Blob ID: {blobId}</p>
                        <p>Content Store Size: {contentStore.getSize()}</p>
                        <p>localStorage: {localStorage.getItem('tempArticleContent') ? 'Has content' : 'Empty'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Format address for display
    const formatAddress = (address: string) => {
        if (!address) return "Unknown";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "Recent";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            return "Recent";
        }
    };

    return (
        <div className='min-h-screen'>
            <div className='container mx-auto px-4 py-8'>
                {/* Back button */}
                <div className='mb-6'>
                    <Button
                        variant='ghost'
                        onClick={() => router.push('/')}
                        className='flex items-center gap-2'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        Back to Articles
                    </Button>
                </div>

                {/* Article Content */}
                <div className='max-w-4xl mx-auto'>
                    <Card className='shadow-lg'>
                        <CardHeader className='pb-4'>
                            <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                    <div className='flex items-center gap-2 mb-3'>
                                        <Badge variant='default' className='text-sm bg-green-600'>
                                            <CheckCircle className='h-3 w-3 mr-1' />
                                            FULL ACCESS
                                        </Badge>
                                        <span className='text-sm text-muted-foreground'>
                                            by {formatAddress(article.metadata.ownerAddress)}
                                        </span>
                                    </div>
                                    <CardTitle className='text-3xl font-bold mb-2'>
                                        {article.title}
                                    </CardTitle>
                                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                        <div className='flex items-center gap-1'>
                                            <User className='h-4 w-4' />
                                            <span>{formatAddress(article.metadata.ownerAddress)}</span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='h-4 w-4' />
                                            <span>{formatDate(article.metadata.uploadDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className='pt-0'>
                            {/* Full Content */}
                            <div className='prose max-w-none'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <FileText className='h-6 w-6 text-green-600' />
                                    <h3 className='text-xl font-semibold text-green-800'>Full Article Content</h3>
                                </div>
                                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                                    <MarkdownViewer content={article.content} />
                                </div>
                            </div>

                            {/* Success Message */}
                            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mt-6'>
                                <div className='flex items-center gap-2'>
                                    <CheckCircle className='h-5 w-5 text-green-600' />
                                    <h3 className='font-semibold text-green-900'>Access Granted!</h3>
                                </div>
                                <p className='text-green-800 text-sm mt-1'>
                                    You have successfully paid for and accessed this article. Thank you for supporting the author!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
