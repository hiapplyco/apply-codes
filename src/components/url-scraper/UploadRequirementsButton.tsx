import React from 'react';
import { Upload } from 'lucide-react';
import { URLScrapeButton } from './URLScrapeButton';
import { PerplexitySearchButton } from '@/components/perplexity/PerplexitySearchButton';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface UploadRequirementsButtonProps {
  onScrapedContent?: (content: { text: string; rawContent: string; url: string }) => void;
  onSearchResult?: (content: { text: string; query: string; searchId?: string }) => void;
  projectId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  context?: 'sourcing' | 'job-posting' | 'linkedin' | 'interview' | 'general';
  variant?: 'default' | 'inline';
}

const tooltipContent = {
  sourcing: {
    title: "Scrape Job Posting",
    description: "Extract job requirements from any job posting URL to help with candidate sourcing"
  },
  'job-posting': {
    title: "Import Job Details",
    description: "Scrape job posting content to auto-fill job details and requirements"
  },
  linkedin: {
    title: "Scrape LinkedIn Job",
    description: "Extract job details from LinkedIn job postings"
  },
  interview: {
    title: "Import Job Requirements",
    description: "Scrape job posting to prepare targeted interview questions"
  },
  general: {
    title: "Scrape Website",
    description: "Extract text content from any website URL"
  }
};

export function UploadRequirementsButton({
  onScrapedContent,
  onSearchResult,
  projectId,
  className = '',
  size = 'md',
  context = 'general',
  variant = 'default'
}: UploadRequirementsButtonProps) {
  const tooltip = tooltipContent[context] || tooltipContent.general;

  const button = (
    <URLScrapeButton
      onScrapedContent={onScrapedContent}
      className={variant === 'inline' ? 'border-2 border-black bg-white hover:bg-gray-50' : ''}
      buttonText="Scrape Website"
      size={size}
      context={context === 'linkedin' ? 'general' : context}
    />
  );

  return (
    <div className="flex items-center gap-2">
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
      {onSearchResult && (
        <PerplexitySearchButton
          onSearchResult={onSearchResult}
          projectId={projectId}
          size={size}
        />
      )}
    </div>
  );
}