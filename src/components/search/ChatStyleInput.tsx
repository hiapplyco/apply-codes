import React, { useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Paperclip, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatStyleInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxHeight?: number;
  className?: string;
}

export const ChatStyleInput = forwardRef<HTMLTextAreaElement, ChatStyleInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    onFileSelect,
    placeholder = "Describe the ideal candidate or paste a job description...",
    disabled = false,
    isLoading = false,
    maxHeight = 200,
    className,
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea as content changes
    useEffect(() => {
      const textarea = textareaRef.current || (ref as any)?.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = '24px'; // Start with minimum height
      
      // Calculate new height
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 24; // Minimum height in pixels
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      
      // Set the new height
      textarea.style.height = `${newHeight}px`;
      
      // Add or remove scrollbar based on content
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }, [value, maxHeight, ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    const handleFileClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onFileSelect) {
        onFileSelect(file);
      }
    };

    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative flex items-center gap-2">
          
          {/* File Upload Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={handleFileClick}
                  disabled={disabled || isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="bg-gray-900 text-white border-gray-700">
                <p className="text-sm">Upload a file (PDF, DOCX, TXT)</p>
                <p className="text-xs text-gray-300">Job descriptions or requirements</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Textarea */}
          <textarea
            ref={(node) => {
              if (textareaRef) (textareaRef as any).current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "flex-1 resize-none bg-transparent outline-none text-base",
              "placeholder:text-gray-400",
              "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
              "min-h-[24px]", // Match button height
              "leading-[24px]", // Center text vertically
              "pt-0 pb-0" // Remove vertical padding
            )}
            style={{
              overflowY: 'hidden', // Will be changed to 'auto' when content exceeds maxHeight
            }}
          />
          
          {/* Info Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 flex items-center justify-center text-gray-400 cursor-help">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-sm bg-gray-900 text-white border-gray-700">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Input Options:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Natural Language:</strong> "Senior React developer with 5+ years experience"</li>
                    <li>• <strong>Job Title + Skills:</strong> "Product Manager with SQL and analytics"</li>
                    <li>• <strong>Boolean Search:</strong> "(React OR Vue) AND Senior NOT Junior"</li>
                    <li>• <strong>Company Specific:</strong> "Engineers at Google or Meta"</li>
                    <li>• <strong>Location Based:</strong> "Data Scientists in San Francisco Bay Area"</li>
                    <li>• <strong>File Upload:</strong> Upload job descriptions for AI-powered candidate matching</li>
                  </ul>
                  <p className="text-xs text-gray-300 pt-1">Press Enter to search, Shift+Enter for new line</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Character count (optional) */}
        {value.length > 100 && (
          <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {value.length} characters
          </div>
        )}
      </div>
    );
  }
);

ChatStyleInput.displayName = 'ChatStyleInput';