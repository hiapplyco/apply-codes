/**
 * LinkedInPostMockup
 *
 * Displays generated LinkedIn post content in a realistic phone frame mockup
 * with LinkedIn UI elements including reactions, comments, and actions.
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Globe,
  Copy,
  Download,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Image data structure for download/copy functionality
interface ImageData {
  base64Data: string;
  mimeType: string;
  dataUrl: string;
}

interface LinkedInPostMockupProps {
  content: string;
  authorName?: string;
  authorTitle?: string;
  authorAvatar?: string;
  companyName?: string;
  imageUrl?: string;
  imageData?: ImageData;
  hashtags?: string[];
  timestamp?: string;
  className?: string;
}

export function LinkedInPostMockup({
  content,
  authorName = 'Talent Acquisition',
  authorTitle = 'Recruiter',
  authorAvatar,
  companyName = 'Your Company',
  imageUrl,
  imageData,
  hashtags = [],
  timestamp = 'Just now',
  className,
}: LinkedInPostMockupProps) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const fullContent = hashtags.length > 0
        ? `${content}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
        : content;
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success('Post copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[LinkedInPostMockup] Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl && !imageData) {
      toast.error('No image to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = imageUrl || imageData?.dataUrl || '';
      link.download = `linkedin-post-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('[LinkedInPostMockup] Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  const handleCopyImage = async () => {
    if (!imageData) {
      toast.error('No image data available to copy');
      return;
    }

    try {
      // Convert base64 to blob
      const binaryString = atob(imageData.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: imageData.mimeType });

      await navigator.clipboard.write([
        new ClipboardItem({
          [imageData.mimeType]: blob,
        }),
      ]);
      setImageCopied(true);
      toast.success('Image copied to clipboard!');
      setTimeout(() => setImageCopied(false), 2000);
    } catch (error) {
      console.error('[LinkedInPostMockup] Image copy failed:', error);
      toast.error('Failed to copy image');
    }
  };

  // Extract hashtags from content if not provided
  const displayHashtags = hashtags.length > 0
    ? hashtags
    : (content.match(/#\w+/g) || []).map(h => h.slice(1));

  // Remove hashtags from content for display
  const displayContent = content.replace(/#\w+/g, '').trim();

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Phone Frame */}
      <div className="relative mx-auto">
        {/* Phone Bezel */}
        <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-800">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-10" />

          {/* Screen */}
          <div className="bg-white rounded-[2rem] overflow-hidden w-[300px] h-[580px] relative">
            {/* Status Bar */}
            <div className="h-10 bg-white flex items-center justify-between px-6 pt-2">
              <span className="text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                </svg>
              </div>
            </div>

            {/* LinkedIn Header */}
            <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#0A66C2] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">in</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">Feed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
              </div>
            </div>

            {/* Post Content - Scrollable */}
            <div className="overflow-y-auto h-[calc(100%-96px)] bg-gray-100">
              <div className="bg-white m-2 rounded-lg shadow-sm border border-gray-200">
                {/* Post Header */}
                <div className="p-3 flex items-start gap-2">
                  <Avatar className="w-10 h-10 border border-gray-200">
                    {authorAvatar ? (
                      <AvatarImage src={authorAvatar} />
                    ) : (
                      <AvatarFallback className="bg-purple-600 text-white font-bold text-sm">
                        {authorName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 text-xs">{authorName}</span>
                      <span className="text-gray-400 text-[10px]">• 1st</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{authorTitle} at {companyName}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span>{timestamp}</span>
                      <span>•</span>
                      <Globe className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>

                {/* Post Text */}
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {displayContent.length > 350 ? displayContent.substring(0, 350) + '...' : displayContent}
                  </p>

                  {/* Hashtags */}
                  {displayHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {displayHashtags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-[#0A66C2] text-[10px] hover:underline cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Image */}
                {imageUrl ? (
                  <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Post image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center border-y border-gray-200">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-[10px]">Image will appear here</p>
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-gray-500 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border border-white">
                        <ThumbsUp className="w-2 h-2 text-white" />
                      </div>
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white">
                        <span className="text-[6px]">❤️</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border border-white">
                        <span className="text-[6px]">👏</span>
                      </div>
                    </div>
                    <span>{liked ? '48' : '47'}</span>
                  </div>
                  <span>12 comments • 8 reposts</span>
                </div>

                {/* Action Buttons */}
                <div className="px-1 py-0.5 flex items-center justify-around">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("flex-1 h-8 text-[10px] gap-1", liked && "text-[#0A66C2]")}
                    onClick={() => setLiked(!liked)}
                  >
                    <ThumbsUp className={cn("w-3 h-3", liked && "fill-current")} />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-[10px] gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-[10px] gap-1">
                    <Share2 className="w-3 h-3" />
                    Repost
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-[10px] gap-1">
                    <Send className="w-3 h-3" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-600 rounded-full" />
      </div>

      {/* Action Buttons Below Phone */}
      <div className="flex flex-wrap gap-3 mt-6 justify-center">
        <Button
          onClick={handleCopy}
          className="bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Post
            </>
          )}
        </Button>

        {/* Image Actions - only show if image exists */}
        {(imageUrl || imageData) && (
          <>
            <Button
              onClick={handleCopyImage}
              variant="outline"
              className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              disabled={!imageData}
            >
              {imageCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Image Copied!
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Copy Image
                </>
              )}
            </Button>
            <Button
              onClick={handleDownloadImage}
              variant="outline"
              className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default LinkedInPostMockup;
