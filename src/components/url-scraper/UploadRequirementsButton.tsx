import React from 'react';
import { Upload } from 'lucide-react';
import { URLScrapeButton } from './URLScrapeButton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UploadRequirementsButtonProps {
  onScrapedContent?: (content: { text: string; rawContent: string; url: string }) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  context?: 'sourcing' | 'job-posting' | 'linkedin' | 'interview' | 'general';
  variant?: 'default' | 'inline';
}

// Context-specific tooltip content
const tooltipContent: Record<string, { title: string; description: string }> = {
  sourcing: {
    title: "Scrape Website",
    description: "Import a job description from a URL. We'll extract key skills, experience levels, and requirements to populate the input field so you can review and edit before generating your search string."
  },
  'job-posting': {
    title: "Import Existing Job Post",
    description: "Import an existing job posting from any URL. We'll extract the content and help you enhance it with AI-powered improvements and analysis."
  },
  linkedin: {
    title: "Import Job Details",
    description: "Import job requirements to create an engaging LinkedIn post. We'll extract key points and help you craft a compelling social media announcement."
  },
  interview: {
    title: "Import Job Description",
    description: "Upload the job description to generate tailored interview questions, evaluation criteria, and preparation materials."
  },
  general: {
    title: "Upload Requirements",
    description: "Import content from any URL. We'll extract and process the information for your current workflow."
  }
};

export function UploadRequirementsButton({
  onScrapedContent,
  className = '',
  size = 'md',
  context = 'general',
  variant = 'default'
}: UploadRequirementsButtonProps) {
  const tooltip = tooltipContent[context] || tooltipContent.general;

  // For inline variant, modify the button to fit better within forms
  const inlineClasses = variant === 'inline' 
    ? 'border-2 border-black bg-white hover:bg-gray-50' 
    : '';

  const button = (
    <URLScrapeButton
      onScrapedContent={onScrapedContent}
      className={`${inlineClasses} ${className}`}
      buttonText="Scrape Website"
      size={size}
      context={context === 'linkedin' ? 'general' : context}
    />
  );

  // If inline variant, use Upload icon instead of Link2
  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex">
              {button}
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-gray-900 text-white border-gray-700 p-3"
          >
            <p className="text-sm font-semibold mb-1">{tooltip.title}</p>
            <p className="text-xs text-gray-300">{tooltip.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default standalone button with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-gray-900 text-white border-gray-700 p-3"
        >
          <p className="text-sm font-semibold mb-1">{tooltip.title}</p>
          <p className="text-xs text-gray-300">{tooltip.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}