"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  User,
  ExternalLink,
  Eye,
  Clock,
  Tag,
  Star,
  MessageCircle,
  ThumbsUp,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { useEnsAvatar } from "wagmi";

interface ArticleCardProps {
  blobId: string;
  title: string;
  description: string;
  ownerAddress: string;
  uploadDate: string;
  onClickAction: (blobId: string) => void; // Keep for backward compatibility but won't be used
}

export function ArticleCard({
  blobId,
  title,
  description,
  ownerAddress,
  uploadDate,
  onClickAction,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingEns, setIsLoadingEns] = useState(false);
  const router = useRouter();

  // Get ENS avatar using wagmi hook
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1, // Ethereum Mainnet
  });

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
      if (!ownerAddress || !ownerAddress.startsWith("0x")) return;

      setIsLoadingEns(true);
      try {
        const ens = await getENSName(ownerAddress as `0x${string}`);
        setEnsName(ens);
      } catch (error) {
        console.error("Error fetching ENS name:", error);
      } finally {
        setIsLoadingEns(false);
      }
    };

    fetchENSName();
  }, [ownerAddress]);

  // Get display name (ENS name or formatted address)
  const getDisplayName = () => {
    if (ensName) return ensName;
    return formatAddress(ownerAddress);
  };

  // Navigate to preview page instead of directly requesting payment
  const handleClick = () => {
    router.push(`/preview/${blobId}`);
  };

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

  // Extract tags from description (if any)
  const extractTags = (text: string) => {
    if (!text) return [];
    const tagMatch = text.match(/#(\w+)/g);
    return tagMatch ? tagMatch.slice(0, 3) : [];
  };

  const tags = extractTags(description);

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <CardContent className='p-6'>
        <div className='flex gap-6'>
          {/* Left side - Text content */}
          <div className='flex-1 min-w-0'>
            {/* Author and category at top */}
            <div className='flex items-center gap-2 mb-3'>
              <Badge variant='default' className='text-xs'>
                {tags.length > 0
                  ? tags[0].replace("#", "").toUpperCase()
                  : "ARTICLE"}
              </Badge>
              <div className='flex items-center'>
                <span className='text-sm text-muted-foreground'>
                  {isLoadingEns ? "Loading..." : getDisplayName()}
                </span>
              </div>
            </div>

            {/* Title */}
            <CardTitle className='text-xl font-bold mb-2 line-clamp-2'>
              {title}
            </CardTitle>

            {/* Description */}
            {description && (
              <CardDescription className='text-sm mb-4 line-clamp-2'>
                {description}
              </CardDescription>
            )}

            {/* Engagement metrics at bottom */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Star className='h-3 w-3 text-yellow-500' />
                  <span>{formatDate(uploadDate)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <ThumbsUp className='h-3 w-3' />
                  <span>1.2K</span>
                </div>
                <div className='flex items-center gap-1'>
                  <MessageCircle className='h-3 w-3' />
                  <span>45</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                  <Bookmark className='h-3 w-3' />
                </Button>
                <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
