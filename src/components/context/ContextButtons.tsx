import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Globe, Search, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/context/ProjectContext';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { PerplexitySearchModal } from '@/components/perplexity/PerplexitySearchModal';
import { URLScrapeModal } from '@/components/url-scraper/URLScrapeModal';
import { toast } from 'sonner';

export interface ContextButtonsProps {
  /** Current page context for targeted content handling */
  context: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';
  
  /** Size variant for responsive layouts */
  size?: 'sm' | 'default' | 'lg';
  
  /** Display variant - inline, toolbar, or floating */
  variant?: 'inline' | 'toolbar' | 'floating';
  
  /** Callback when content is processed and ready */
  onContentProcessed?: (content: {
    type: 'upload' | 'firecrawl' | 'perplexity';
    text: string;
    metadata?: Record<string, any>;
    projectId?: string;
  }) => void;
  
  /** Enable/disable specific buttons */
  enabledButtons?: {
    upload?: boolean;
    firecrawl?: boolean;
    perplexity?: boolean;
  };
  
  /** Custom styling classes */
  className?: string;
  
  /** Show labels alongside icons */
  showLabels?: boolean;
  
  /** Compact mode for minimal space */
  compact?: boolean;
}

export const ContextButtons: React.FC<ContextButtonsProps> = ({
  context,
  size = 'default',
  variant = 'inline',
  onContentProcessed,
  enabledButtons = { upload: true, firecrawl: true, perplexity: true },
  className,
  showLabels = true,
  compact = false
}) => {
  const { selectedProject } = useProjectContext();
  const [isPerplexityModalOpen, setIsPerplexityModalOpen] = useState(false);
  const [isFirecrawlModalOpen, setIsFirecrawlModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // File input ref for upload functionality
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing('upload');

    try {
      // Use existing DocumentProcessor for consistent file handling
      const validation = DocumentProcessor.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const content = await DocumentProcessor.processDocument(file);
      
      // Store in project context if selected
      if (selectedProject?.id) {
        await DocumentProcessor.saveToProject(selectedProject.id, {
          content,
          filename: file.name,
          context
        });
      }

      onContentProcessed?.({
        type: 'upload',
        text: content,
        metadata: {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          processingMethod: 'client-side'
        },
        projectId: selectedProject?.id
      });

      toast.success(`Document "${file.name}" processed successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedProject, context, onContentProcessed]);

  const handleFirecrawlContent = useCallback(async (content: any) => {
    setIsProcessing('firecrawl');

    try {
      onContentProcessed?.({
        type: 'firecrawl',
        text: content.text || content.summary,
        metadata: {
          url: content.url,
          title: content.title,
          timestamp: new Date().toISOString(),
          context
        },
        projectId: selectedProject?.id
      });

      toast.success('Website content scraped successfully');
    } catch (error) {
      console.error('Firecrawl processing error:', error);
      toast.error('Failed to process scraped content');
    } finally {
      setIsProcessing(null);
    }
  }, [selectedProject, context, onContentProcessed]);

  const handlePerplexityResult = useCallback(async (result: any) => {
    setIsProcessing('perplexity');

    try {
      onContentProcessed?.({
        type: 'perplexity',
        text: result.text || result.content,
        metadata: {
          query: result.query,
          sources: result.sources,
          timestamp: new Date().toISOString(),
          context
        },
        projectId: selectedProject?.id
      });

      toast.success('AI search completed successfully');
    } catch (error) {
      console.error('Perplexity processing error:', error);
      toast.error('Failed to process search results');
    } finally {
      setIsProcessing(null);
    }
  }, [selectedProject, context, onContentProcessed]);

  // Dynamic button sizing
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  // Brutalist styling consistent with Apply design system
  const buttonStyles = cn(
    "border-2 border-black transition-all duration-200",
    "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    "bg-white hover:bg-gray-50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    compact && "p-2"
  );

  // Container styling based on variant
  const containerStyles = cn(
    "flex gap-2",
    variant === 'toolbar' && "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 rounded-lg",
    variant === 'floating' && "fixed bottom-6 right-6 z-50 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg p-3",
    variant === 'inline' && "items-center",
    className
  );

  return (
    <div className={containerStyles}>
      {/* Upload Button */}
      {enabledButtons.upload && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size={buttonSize}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing === 'upload'}
            className={buttonStyles}
          >
            {isProcessing === 'upload' ? (
              <div className="animate-spin">
                <Upload className={iconSize} />
              </div>
            ) : (
              <Upload className={iconSize} />
            )}
            {showLabels && !compact && (
              <span className="ml-2">
                {isProcessing === 'upload' ? 'Processing...' : 'Upload'}
              </span>
            )}
          </Button>
        </>
      )}

      {/* Firecrawl Button */}
      {enabledButtons.firecrawl && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => setIsFirecrawlModalOpen(true)}
          disabled={isProcessing === 'firecrawl'}
          className={buttonStyles}
        >
          {isProcessing === 'firecrawl' ? (
            <div className="animate-spin">
              <Globe className={iconSize} />
            </div>
          ) : (
            <Globe className={iconSize} />
          )}
          {showLabels && !compact && (
            <span className="ml-2">
              {isProcessing === 'firecrawl' ? 'Scraping...' : 'Scrape'}
            </span>
          )}
        </Button>
      )}

      {/* Perplexity Button */}
      {enabledButtons.perplexity && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => setIsPerplexityModalOpen(true)}
          disabled={isProcessing === 'perplexity'}
          className={buttonStyles}
        >
          {isProcessing === 'perplexity' ? (
            <div className="animate-spin">
              <Search className={iconSize} />
            </div>
          ) : (
            <Search className={iconSize} />
          )}
          {showLabels && !compact && (
            <span className="ml-2">
              {isProcessing === 'perplexity' ? 'Searching...' : 'Search'}
            </span>
          )}
        </Button>
      )}

      {/* Modals */}
      <URLScrapeModal
        open={isFirecrawlModalOpen}
        onClose={() => setIsFirecrawlModalOpen(false)}
        onScrapedContent={handleFirecrawlContent}
        projectId={selectedProject?.id}
        context={context}
      />

      <PerplexitySearchModal
        open={isPerplexityModalOpen}
        onClose={() => setIsPerplexityModalOpen(false)}
        onSearchResult={handlePerplexityResult}
        projectId={selectedProject?.id}
        context={context}
      />
    </div>
  );
};

export default ContextButtons;