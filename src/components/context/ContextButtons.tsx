import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Globe, Search, FileText, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/context/ProjectContext';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { PerplexitySearchModal } from '@/components/perplexity/PerplexitySearchModal';
import { URLScrapeModal } from '@/components/url-scraper/URLScrapeModal';
import LocationModal from '@/components/LocationModal';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { useUnifiedAuth } from '@/context/UnifiedAuthContext';
import { toast } from 'sonner';

export interface ContextButtonsProps {
  /** Current page context for targeted content handling */
  context: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';

  /** Size variant for responsive layouts */
  size?: 'sm' | 'default' | 'lg' | 'compact';

  /** Display variant - inline, toolbar, floating, or responsive */
  variant?: 'inline' | 'toolbar' | 'floating' | 'responsive';

  /** Callback when content is processed and ready */
  onContentProcessed?: (content: {
    type: 'upload' | 'firecrawl' | 'perplexity' | 'location';
    text: string;
    metadata?: Record<string, any>;
    projectId?: string;
  }) => void;

  /** Callback when location is selected */
  onLocationSelected?: (location: {
    formatted_address: string;
    place_id: string;
    geometry: any;
    address_components: any[];
  }) => void;

  /** Enable/disable specific buttons */
  enabledButtons?: {
    upload?: boolean;
    firecrawl?: boolean;
    perplexity?: boolean;
    location?: boolean;
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
  onLocationSelected,
  enabledButtons = { upload: true, firecrawl: true, perplexity: true, location: true },
  className,
  showLabels = true,
  compact = false
}) => {
  const { selectedProject } = useProjectContext();
  const { user } = useUnifiedAuth();
  const [isPerplexityModalOpen, setIsPerplexityModalOpen] = useState(false);
  const [isFirecrawlModalOpen, setIsFirecrawlModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // File input ref for upload functionality
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Universal context item storage function - uses direct Firestore writes
  const saveContextItem = useCallback(async (item: {
    type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input' | 'location_input';
    title: string;
    content: string;
    summary?: string;
    source_url?: string;
    file_name?: string;
    file_type?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!user?.uid) {
      console.warn('User not authenticated, skipping context item save');
      return;
    }

    try {
      const insertResult = await firestoreClient
        .from('context_items')
        .insert({
          ...item,
          user_id: user.uid,
          project_id: selectedProject?.id || null,
          tags: [context],
          created_at: new Date().toISOString()
        });

      if (insertResult.error) {
        throw insertResult.error;
      }

      console.log('Context item saved successfully:', insertResult.data);
    } catch (error) {
      console.error('Error saving context item:', error);
      // Don't throw - graceful degradation
    }
  }, [user, selectedProject, context]);

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
  }, [selectedProject, context, onContentProcessed, saveContextItem]);

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

  const handleLocationSelect = useCallback(async (location: {
    formatted_address: string;
    place_id: string;
    geometry: any;
    address_components: any[];
  }) => {
    setIsProcessing('location');

    try {
      // Extract location components for better boolean generation
      const locationData = {
        formatted_address: location.formatted_address,
        place_id: location.place_id,
        geometry: location.geometry,
        address_components: location.address_components
      };

      // Parse location components
      const parsedLocation = parseLocationComponents(location.address_components);
      const locationString = generateLocationString(parsedLocation);

      // Save to context items
      await saveContextItem({
        type: 'location_input',
        title: `Location: ${location.formatted_address}`,
        content: locationString,
        summary: `Search location set to ${location.formatted_address}`,
        metadata: {
          ...locationData,
          parsedLocation,
          selectedAt: new Date().toISOString()
        }
      });

      // Call the location selected callback
      onLocationSelected?.(locationData);

      // Call content processed callback for consistency
      onContentProcessed?.({
        type: 'location',
        text: locationString,
        metadata: {
          ...locationData,
          parsedLocation,
          context
        },
        projectId: selectedProject?.id
      });

      toast.success(`Location set to ${location.formatted_address}`);
    } catch (error) {
      console.error('Location processing error:', error);
      toast.error('Failed to process location');
    } finally {
      setIsProcessing(null);
    }
  }, [selectedProject, context, onContentProcessed, onLocationSelected, saveContextItem]);

  // Helper function to parse location components
  const parseLocationComponents = (components: any[]) => {
    const parsed: any = {};
    components.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) {
        parsed.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.state = component.long_name;
        parsed.stateShort = component.short_name;
      } else if (types.includes('administrative_area_level_2')) {
        parsed.county = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
        parsed.countryShort = component.short_name;
      } else if (types.includes('postal_code')) {
        parsed.zipCode = component.long_name;
      }
    });
    return parsed;
  };

  // Helper function to generate location string for boolean search
  const generateLocationString = (parsed: any) => {
    const parts = [];
    if (parsed.city) parts.push(parsed.city);
    if (parsed.state) parts.push(parsed.state, parsed.stateShort);
    if (parsed.county) parts.push(parsed.county);
    if (parsed.zipCode) parts.push(parsed.zipCode);
    return parts.join(', ');
  };

  // Dynamic button sizing
  const buttonSize = size === 'sm' || size === 'compact' ? 'sm' : size === 'lg' ? 'lg' : 'default';
  const iconSize = size === 'sm' || size === 'compact' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  // Clean, minimal button styling
  const buttonStyles = cn(
    "border border-gray-300 transition-colors duration-150",
    "hover:border-gray-400 hover:bg-gray-50",
    "bg-white",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "flex-shrink-0",
    "rounded-lg",
    compact && "p-2"
  );

  // Container styling based on variant - simplified
  const containerStyles = cn(
    "flex flex-wrap gap-2 items-center",
    size === 'compact' && "gap-1",
    variant === 'toolbar' && "bg-white border border-gray-200 p-3 rounded-lg",
    variant === 'floating' && "fixed bottom-6 right-6 z-50 bg-white border border-gray-200 shadow-lg rounded-lg p-3",
    variant === 'inline' && "justify-start",
    variant === 'responsive' && "justify-start w-full",
    className
  );

  return (
    <div className={containerStyles} style={{ maxWidth: 'calc(100% - 8px)' }}>
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

      {/* Location Button */}
      {enabledButtons.location && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => setIsLocationModalOpen(true)}
          disabled={isProcessing === 'location'}
          className={buttonStyles}
          type="button"
        >
          {isProcessing === 'location' ? (
            <div className="animate-spin">
              <MapPin className={iconSize} />
            </div>
          ) : (
            <MapPin className={iconSize} />
          )}
          {showLabels && !compact && (
            <span className="ml-2">
              {isProcessing === 'location' ? 'Processing...' : 'Location'}
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

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
};

export default ContextButtons;
