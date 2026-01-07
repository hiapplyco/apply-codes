/**
 * DocumentMockup
 *
 * Displays generated document content (job descriptions, offer letters)
 * in a professional paper-style mockup with formatting.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Download,
  Check,
  FileText,
  ChevronDown,
  Printer,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentMockupProps {
  content: string;
  title?: string;
  documentType?: 'job-description' | 'offer-letter' | 'generic';
  companyName?: string;
  date?: string;
  className?: string;
}

export function DocumentMockup({
  content,
  title = 'Document',
  documentType = 'generic',
  companyName = 'Your Company',
  date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }),
  className,
}: DocumentMockupProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Document copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[DocumentMockup] Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  // Parse markdown-style formatting for display
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
              {line.replace('# ', '')}
            </h1>
          );
        }
        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-semibold text-gray-800 mt-5 mb-2 border-b border-gray-200 pb-1">
              {line.replace('## ', '')}
            </h2>
          );
        }
        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-lg font-medium text-gray-700 mt-4 mb-2">
              {line.replace('### ', '')}
            </h3>
          );
        }
        // Bold text (simple)
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-gray-800 my-2">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }
        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-6 text-gray-700 my-1 list-disc">
              {line.replace(/^[-*]\s/, '')}
            </li>
          );
        }
        // Horizontal rule
        if (line === '---' || line === '***') {
          return <hr key={i} className="my-4 border-gray-200" />;
        }
        // Empty line
        if (line.trim() === '') {
          return <div key={i} className="h-3" />;
        }
        // Regular paragraph
        return (
          <p key={i} className="text-gray-700 my-2 leading-relaxed">
            {line}
          </p>
        );
      });
  };

  const getDocumentIcon = () => {
    switch (documentType) {
      case 'job-description':
        return '📄';
      case 'offer-letter':
        return '🎉';
      default:
        return '📋';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Document Frame */}
      <Card className="border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
        {/* Document Header */}
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                {getDocumentIcon()}
              </div>
              <div>
                <CardTitle className="text-gray-900">{title}</CardTitle>
                <p className="text-sm text-gray-500">{companyName} • {date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Printer className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Document Content */}
        <CardContent className="p-6 md:p-8">
          {/* Paper Effect */}
          <div className="relative">
            {/* Page shadow effect */}
            <div className="absolute -right-1 -bottom-1 w-full h-full bg-gray-200 rounded-sm" />
            <div className="absolute -right-2 -bottom-2 w-full h-full bg-gray-300 rounded-sm" />

            {/* Main paper */}
            <div className="relative bg-white border border-gray-200 rounded-sm p-6 md:p-8 shadow-sm min-h-[400px]">
              {/* Company letterhead */}
              {documentType === 'offer-letter' && (
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="text-lg font-bold text-purple-600">{companyName}</div>
                  <div className="text-sm text-gray-500">Human Resources Department</div>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm max-w-none">
                {formatContent(content)}
              </div>
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
              Copy Document
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-2 border-black">
            <DropdownMenuItem onClick={() => handleDownload('txt')}>
              <FileText className="w-4 h-4 mr-2" />
              Plain Text (.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('md')}>
              <FileText className="w-4 h-4 mr-2" />
              Markdown (.md)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default DocumentMockup;
