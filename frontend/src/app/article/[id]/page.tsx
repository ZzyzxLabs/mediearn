"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, ExternalLink } from "lucide-react";
import MarkdownViewer from "@/components/MarkdownViewer";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useEnsAvatar } from "wagmi";
import { ArticleContent } from "@/lib/api";
import { contentStore } from "@/lib/contentStore";

export default function ArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [article, setArticle] = useState<ArticleContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ensName, setEnsName] = useState<string | null>(null);
    const [isLoadingEns, setIsLoadingEns] = useState(false);

    const blobId = params.id as string;

    // Get ENS avatar using wagmi hook
    const { data: ensAvatar } = useEnsAvatar({
        name: ensName || undefined,
        chainId: 1, // Ethereum Mainnet
    });

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
    });

    async function getENSName(address: `0x${string}`) {
        try {
            const ensName = await publicClient.getEnsName({ address });
            return ensName;
        } catch (error) {
            console.error("Error fetching ENS name:", error);
            return null;
        }
    }

    // Fetch ENS name on component mount
    useEffect(() => {
        const fetchENSName = async () => {
            if (!article?.metadata.ownerAddress || !article.metadata.ownerAddress.startsWith("0x")) return;

            setIsLoadingEns(true);
            try {
                const ens = await getENSName(article.metadata.ownerAddress as `0x${string}`);
                setEnsName(ens);
            } catch (error) {
                console.error("Error fetching ENS name:", error);
            } finally {
                setIsLoadingEns(false);
            }
        };

        if (article) {
            fetchENSName();
        }
    }, [article?.metadata.ownerAddress]);

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

    // Get display name (ENS name or formatted address)
    const getDisplayName = () => {
        if (ensName) return ensName;
        return article ? formatAddress(article.metadata.ownerAddress) : "Unknown";
    };

    // Open explorer for the address
    const openExplorer = () => {
        if (!article) return;
        const explorerUrl = `https://etherscan.io/address/${article.metadata.ownerAddress}`;
        window.open(explorerUrl, "_blank");
    };

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
            <div className='min-h-screen'>
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

    return (
        <div className='min-h-screen'>
            <div className='container mx-auto px-4 py-8 max-w-6xl'>
                {/* Back button */}
                <Button variant='ghost' onClick={() => router.push('/')} className='mb-6'>
                    ← Back to Articles
                </Button>

                {/* Article content */}
                <Card>
                    <CardHeader>
                        <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                                <CardTitle className='mb-6'>{article.title}</CardTitle>
                                <div className='flex items-center space-x-6 text-muted-foreground'>
                                    <div className='flex items-center'>
                                        {ensAvatar ? (
                                            <img
                                                src={ensAvatar}
                                                alt={getDisplayName()}
                                                className='h-4 w-4 mr-2 rounded-full'
                                            />
                                        ) : (
                                            <User className='h-4 w-4 mr-2' />
                                        )}
                                        <span>
                                            {isLoadingEns ? "Loading..." : getDisplayName()}
                                        </span>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={openExplorer}
                                            className='ml-2 h-6 w-6 p-0 hover:bg-muted'
                                            title='View on Etherscan'
                                        >
                                            <ExternalLink className='h-3 w-3' />
                                        </Button>
                                    </div>
                                    <div className='flex items-center'>
                                        <Calendar className='h-4 w-4 mr-2' />
                                        {formatDate(article.metadata.uploadDate)}
                                    </div>
                                    <Badge variant='default'>
                                        Full Access
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className='pt-8'>
                        <div className='bg-muted rounded-lg p-8'>
                            <MarkdownViewer content={article.content} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
