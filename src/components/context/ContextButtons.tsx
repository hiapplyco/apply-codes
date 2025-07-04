import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Globe, Search, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/context/ProjectContext';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { PerplexitySearchModal } from '@/components/perplexity/PerplexitySearchModal';
import { URLScrapeModal } from '@/components/url-scraper/URLScrapeModal';
import { supabase } from '@/integrations/supabase/client';
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

  // Universal context item storage function
  const saveContextItem = useCallback(async (item: {
    type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input';
    title: string;
    content: string;
    summary?: string;
    source_url?: string;
    file_name?: string;
    file_type?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('save-context-item', {
        body: {
          ...item,
          project_id: selectedProject?.id || null, // Always store, project optional
          tags: [context] // Add context as a tag
        }
      });

      if (error) {
        console.error('Failed to save context item:', error);
        // Don't throw - we want the main functionality to still work
      } else {
        console.log('Context item saved successfully:', data);
      }
    } catch (error) {
      console.error('Error saving context item:', error);
      // Don't throw - graceful degradation
    }
  }, [selectedProject, context]);

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

      // Always save to context_items table
      await saveContextItem({
        type: 'file_upload',
        title: `Uploaded: ${file.name}`,
        content: content,
        summary: content.length > 500 ? content.substring(0, 500) + '...' : content,
        file_name: file.name,
        file_type: file.type,
        metadata: {
          fileSize: file.size,
          processingMethod: 'client-side',
          uploadedAt: new Date().toISOString()
        }
      });

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
      const textContent = content.text || content.summary;
      const url = content.url;
      const title = content.title || `Scraped from ${url}`;

      // Always save to context_items table
      await saveContextItem({
        type: 'url_scrape',
        title: title,
        content: textContent,
        summary: textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent,
        source_url: url,
        metadata: {
          title: content.title,
          scrapedAt: new Date().toISOString(),
          source: 'firecrawl',
          rawContent: content.rawContent
        }
      });

      onContentProcessed?.({
        type: 'firecrawl',
        text: textContent,
        metadata: {
          url: url,
          title: title,
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
  }, [selectedProject, context, onContentProcessed, saveContextItem]);

  const handlePerplexityResult = useCallback(async (result: any) => {
    setIsProcessing('perplexity');

    try {
      const textContent = result.text || result.content;
      const query = result.query;
      const title = `Search: ${query}`;

      // Always save to context_items table
      await saveContextItem({
        type: 'perplexity_search',
        title: title,
        content: textContent,
        summary: textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent,
        metadata: {
          query: query,
          sources: result.sources,
          searchId: result.searchId,
          searchedAt: new Date().toISOString(),
          source: 'perplexity'
        }
      });

      onContentProcessed?.({
        type: 'perplexity',
        text: textContent,
        metadata: {
          query: query,
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
  }, [selectedProject, context, onContentProcessed, saveContextItem]);

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
            type="button"
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
          type="button"
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
          type="button"
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
        isOpen={isFirecrawlModalOpen}
        onClose={() => setIsFirecrawlModalOpen(false)}
        onScrapedContent={handleFirecrawlContent}
        projectId={selectedProject?.id}
      />

      <PerplexitySearchModal
        isOpen={isPerplexityModalOpen}
        onClose={() => setIsPerplexityModalOpen(false)}
        onSearchResult={handlePerplexityResult}
      />
    </div>
  );
};

export default ContextButtons;