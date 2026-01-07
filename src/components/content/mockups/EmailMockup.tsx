/**
 * EmailMockup
 *
 * Displays generated email content in a realistic email client mockup
 * with toolbar, headers, and professional styling.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Star,
  Reply,
  Forward,
  Trash2,
  MoreVertical,
  Paperclip,
  Copy,
  Download,
  Check,
  Archive,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailMockupProps {
  content: string;
  subject?: string;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  timestamp?: string;
  isOutreach?: boolean;
  className?: string;
}

export function EmailMockup({
  content,
  subject = 'Exciting Opportunity',
  senderName = 'Talent Acquisition',
  senderEmail = 'recruiting@company.com',
  recipientName = 'Candidate',
  recipientEmail = 'candidate@email.com',
  timestamp = 'Today, 10:30 AM',
  isOutreach = true,
  className,
}: EmailMockupProps) {
  const [starred, setStarred] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse subject from content if it contains "Subject:"
  const parsedSubject = content.match(/Subject:\s*(.+?)(?:\n|$)/i)?.[1] || subject;

  // Remove subject line from content for display
  const displayContent = content.replace(/Subject:\s*.+?\n/i, '').trim();

  const handleCopy = async () => {
    try {
      const fullEmail = `Subject: ${parsedSubject}\n\n${displayContent}`;
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      toast.success('Email copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[EmailMockup] Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Email Client Frame */}
      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Email Client Toolbar */}
        <div className="bg-gray-100 border-b-2 border-black px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Archive className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Trash2 className="w-4 h-4 text-gray-600" />
            </Button>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Reply className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Forward className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Tag className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Email Header */}
        <CardHeader className="border-b border-gray-200 pb-4 bg-white">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 border-2 border-purple-200 flex-shrink-0">
              <AvatarFallback className="bg-purple-600 text-white font-bold">
                {senderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{senderName}</h3>
                  <p className="text-sm text-gray-500">&lt;{senderEmail}&gt;</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-gray-400">{timestamp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setStarred(!starred)}
                  >
                    <Star className={cn(
                      "w-4 h-4",
                      starred ? "text-yellow-500 fill-current" : "text-gray-400"
                    )} />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                To: {recipientName} &lt;{recipientEmail}&gt;
              </p>
            </div>
          </div>

          {/* Subject Line */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{parsedSubject}</h2>
            {isOutreach && (
              <div className="mt-2 inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Cold Outreach
              </div>
            )}
          </div>
        </CardHeader>

        {/* Email Body */}
        <CardContent className="pt-6 bg-white">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
              {displayContent}
            </div>
          </div>

          {/* Email Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Paperclip className="w-4 h-4" />
              <span>No attachments</span>
            </div>
          </div>

          {/* Quick Reply Bar */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-400">
                Click here to reply...
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCopy}
          className="flex-1 bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Email
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}

export default EmailMockup;
