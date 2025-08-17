"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, ExternalLink } from "lucide-react";
import MarkdownViewer from "./MarkdownViewer";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useEnsAvatar } from "wagmi";

interface ArticleDetailCardProps {
  article: {
    blobId: string;
    title: string;
    content: string;
    metadata: {
      uploadDate: string;
      ownerAddress: string;
      isPublic: boolean;
    };
  };
  onBackAction: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ArticleDetailCard({
  article,
  onBackAction,
  loading = false,
  error = null,
  onRetry,
}: ArticleDetailCardProps) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingEns, setIsLoadingEns] = useState(false);

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
      if (
        !article.metadata.ownerAddress ||
        !article.metadata.ownerAddress.startsWith("0x")
      )
        return;

      setIsLoadingEns(true);
      try {
        const ens = await getENSName(
          article.metadata.ownerAddress as `0x${string}`
        );
        setEnsName(ens);
      } catch (error) {
        console.error("Error fetching ENS name:", error);
      } finally {
        setIsLoadingEns(false);
      }
    };

    fetchENSName();
  }, [article.metadata.ownerAddress]);

  // Get display name (ENS name or formatted address)
  const getDisplayName = () => {
    if (ensName) return ensName;
    return formatAddress(article.metadata.ownerAddress);
  };

  // Open explorer for the address
  const openExplorer = () => {
    const explorerUrl = `https://etherscan.io/address/${article.metadata.ownerAddress}`;
    window.open(explorerUrl, "_blank");
  };

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        {/* Back button */}
        <Button variant='ghost' onClick={onBackAction} className='mb-6'>
          ← Back to Articles
        </Button>

        {/* Article content */}
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <CardTitle className='text-3xl mb-4'>{article.title}</CardTitle>
                <div className='flex items-center space-x-6 text-sm text-muted-foreground'>
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
                  <Badge
                    variant={
                      article.metadata.isPublic ? "default" : "secondary"
                    }
                  >
                    {article.metadata.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='pt-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-current mr-3'></div>
                <span>Loading content from Walrus...</span>
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <div className='text-red-600 mb-4'>
                  <p className='font-semibold'>Content Unavailable</p>
                  <p className='text-sm'>{error}</p>
                </div>
                {onRetry && (
                  <Button variant='outline' onClick={onRetry} className='mt-4'>
                    Try Again
                  </Button>
                )}
              </div>
            ) : (
              <div className='bg-muted rounded-lg p-6'>
                <MarkdownViewer content={article.content} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
