"use client";

import { useState } from "react";
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

interface ArticleCardProps {
  blobId: string;
  previewText: string;
  onClick: (blobId: string) => void;
}

export function ArticleCard({
  blobId,
  previewText,
  onClick,
}: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse preview text to extract title and description
  const parsePreviewText = (previewText: string) => {
    const lines = previewText.split("\n");
    const title = lines[0] || "Untitled";
    const description = lines.slice(2).join("\n").trim();

    return {
      title,
      description:
        description && description.length > 0
          ? description.substring(0, 150) +
            (description.length > 150 ? "..." : "")
          : null,
    };
  };

  // Extract metadata from preview text
  const extractMetadata = (previewText: string) => {
    const lines = previewText.split("\n");
    const title = lines[0] || "Untitled";

    // Try to extract date from the text (simple pattern matching)
    const dateMatch = previewText.match(
      /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/
    );
    const uploadDate = dateMatch ? dateMatch[0] : "Recent";

    // Try to extract category/tags
    const tagMatch = previewText.match(/#(\w+)/g);
    const tags = tagMatch ? tagMatch.slice(0, 3) : [];

    return { title, uploadDate, tags };
  };

  const { title, description } = parsePreviewText(previewText);
  const { uploadDate, tags } = extractMetadata(previewText);

  // Mock author address (in real app, this would come from the article data)
  const mockAuthorAddress = "0x1234...5678";

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(blobId)}
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
              <span className='text-sm text-muted-foreground'>
                by {mockAuthorAddress}
              </span>
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
                  <span>{uploadDate}</span>
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
