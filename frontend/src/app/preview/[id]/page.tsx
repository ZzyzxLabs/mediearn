"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, User, Calendar, Lock } from "lucide-react";
import { apiClient, BlobPreview } from "@/lib/api";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { useAccount } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { createClient } from "viem";
import MarkdownViewer from "@/components/MarkdownViewer";
import { contentStore } from "@/lib/contentStore";

export default function PreviewPage() {
    const params = useParams();
    const router = useRouter();
    const [preview, setPreview] = useState<BlobPreview | null>(null);
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

    const blobId = params.id as string;

    // Fetch preview text
    const fetchPreview = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.getBlobPreview(blobId);
            if (data) {
                setPreview(data);
            } else {
                setError("Preview not found");
            }
        } catch (error) {
            setError("Failed to load preview");
            console.error("Error fetching preview:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch full article content with payment
    const fetchFullContent = async () => {
        try {
            setLoadingContent(true);
            setError(null);

            // Check if wallet is connected
            if (!isConnected || !address) {
                throw new Error("Please connect your wallet first");
            }

            console.log("Fetching full article content with payment...", {
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

            console.log("Payment successful, storing content and redirecting...", data);

            // Store content in multiple places for reliability
            try {
                // Primary: Use content store (in-memory)
                contentStore.setContent(blobId, data);
                console.log("Content stored in content store");

                // Secondary: localStorage as backup
                localStorage.setItem('tempArticleContent', JSON.stringify(data));
                console.log("Content stored in localStorage as backup");

                // Tertiary: URL parameter for very small content
                const contentData = encodeURIComponent(JSON.stringify(data));
                const maxUrlLength = 2000; // Safe URL length

                if (contentData.length < maxUrlLength) {
                    console.log("Content small enough for URL, using URL parameter as tertiary backup");
                    // Use replace to avoid back button issues
                    router.replace(`/article/${blobId}?content=${contentData}`);
                } else {
                    console.log("Content too large for URL, using content store and localStorage");
                    // Add a small delay to ensure content is properly stored
                    setTimeout(() => {
                        console.log("Delayed redirect - content store size:", contentStore.getSize());
                        // Use replace to avoid back button issues
                        router.replace(`/article/${blobId}`);
                    }, 100);
                }
            } catch (redirectError) {
                console.error("Error during redirect:", redirectError);
                // Fallback: try to navigate directly
                window.location.href = `/article/${blobId}`;
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
        if (blobId) {
            fetchPreview();
        }
    }, [blobId]);

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='flex items-center space-x-3'>
                    <Loader2 className='h-6 w-6 animate-spin' />
                    <span>Loading preview...</span>
                </div>
            </div>
        );
    }

    if (error || !preview) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-red-600 mb-4'>{error || "Preview not found"}</p>
                    <Button onClick={() => router.push('/')}>Back to Articles</Button>
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

                {/* Preview Card */}
                <div className='max-w-4xl mx-auto'>
                    <Card className='shadow-lg'>
                        <CardHeader className='pb-4'>
                            <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                    <CardTitle className='text-3xl font-bold mb-2'>
                                        {preview.title}
                                    </CardTitle>
                                    {preview.description && (
                                        <p className='text-lg text-muted-foreground mb-4'>
                                            {preview.description}
                                        </p>
                                    )}
                                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                        <div className='flex items-center gap-1'>
                                            <User className='h-4 w-4' />
                                            <span>{formatAddress(preview.ownerAddress)}</span>
                                        </div>
                                        <div className='flex items-center gap-1'>
                                            <Calendar className='h-4 w-4' />
                                            <span>{formatDate(preview.uploadDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className='pt-0'>
                            {/* Preview Content */}
                            <div className='mb-6'>
                                <MarkdownViewer content={preview.contentPreview} />
                            </div>

                            {/* Action Button */}
                            <div className='text-center'>
                                <Button
                                    onClick={fetchFullContent}
                                    disabled={loadingContent || !isConnected}
                                    size='lg'
                                    className='px-8 py-3 text-lg'
                                >
                                    {loadingContent ? (
                                        <>
                                            <Loader2 className='h-5 w-5 animate-spin mr-2' />
                                            Processing Payment...
                                        </>
                                    ) : !isConnected ? (
                                        <>
                                            <Lock className='h-5 w-5 mr-2' />
                                            Connect Wallet to Read Full Article
                                        </>
                                    ) : (
                                        <>
                                            <FileText className='h-5 w-5 mr-2' />
                                            Read Full Article
                                        </>
                                    )}
                                </Button>
                                {!isConnected && (
                                    <p className='text-sm text-muted-foreground mt-2'>
                                        You need to connect your wallet to access the full content
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
