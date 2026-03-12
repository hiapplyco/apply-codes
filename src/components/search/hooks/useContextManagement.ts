import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { DocumentProcessor } from '@/lib/modernPdfProcessor';
import { functionBridge } from '@/lib/function-bridge';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContextItem } from '@/types/search-form';

interface UseContextManagementParams {
  userId: string | null;
  selectedProject: any;
  selectedProjectId: string | null | undefined;
}

// Helper functions for location processing
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

const generateLocationString = (parsed: any) => {
  const parts = [];
  if (parsed.city) parts.push(parsed.city);
  if (parsed.state) parts.push(parsed.state, parsed.stateShort);
  if (parsed.county) parts.push(parsed.county);
  if (parsed.zipCode) parts.push(parsed.zipCode);
  return parts.join(', ');
};

export function useContextManagement({ userId, selectedProject, selectedProjectId }: UseContextManagementParams) {
  // Context management states
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);

  // Input method states
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [perplexityQuery, setPerplexityQuery] = useState('');
  const [isSearchingPerplexity, setIsSearchingPerplexity] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showPerplexityDialog, setShowPerplexityDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context management functions
  const saveContextItem = useCallback(async (item: Omit<ContextItem, 'id' | 'created_at'>) => {
    console.log('💾 saveContextItem called with:', {
      item,
      userId,
      selectedProjectId: selectedProject?.id || selectedProjectId,
      selectedProject: selectedProject?.name,
      timestamp: new Date().toISOString()
    });
    try {
      const insertResult = await firestoreClient
        .from<ContextItem>('context_items')
        .insert({
          ...item,
          user_id: userId,
          project_id: selectedProject?.id || selectedProjectId || null,
          created_at: new Date().toISOString()
        });

      if (insertResult.error) {
        throw insertResult.error;
      }

      const inserted = (Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data) as Partial<ContextItem>;

      const newContextItem: ContextItem = {
        id: '',
        type: 'manual_input',
        title: '',
        content: '',
        ...inserted,
        isExpanded: false
      };

      console.log('Adding new context item to state:', newContextItem);
      setContextItems(prev => {
        const updated = [newContextItem, ...prev];
        console.log('Updated context items:', updated);
        return updated;
      });
      return newContextItem;
    } catch (error) {
      console.error('Error saving context item:', error);
      toast.error('Could not save context. Please try again.');
      return null;
    }
  }, [userId, selectedProject, selectedProjectId]);

  // Firecrawl URL scraping
  const handleUrlScrape = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Check if URL is a LinkedIn URL
    const isLinkedInUrl = urlInput.toLowerCase().includes('linkedin.com');

    if (isLinkedInUrl) {
      // Show sad emoji first
      toast.error('😢 LinkedIn URLs are tricky to scrape...', {
        description: 'LinkedIn has strong anti-scraping measures'
      });

      // Wait a moment, then show happy emoji with clever message
      setTimeout(() => {
        toast.success('😊 But that\'s exactly why we built this tool!', {
          description: 'Use the search below to find and analyze LinkedIn profiles instead 👇'
        });
      }, 2000);

      return;
    }

    setIsScrapingUrl(true);
    try {
      const result = await FirecrawlService.crawlWebsite(urlInput, {
        context: 'sourcing',
        saveToProject: false
      });

      if (result.success && result.data?.text) {
        // Generate summary from content (first 200 chars, strip markdown)
        const stripped = result.data.text
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
          .replace(/[#*_`~]/g, '') // Remove markdown formatting
          .replace(/\n+/g, ' ') // Replace newlines with spaces
          .trim();
        const summary = stripped.substring(0, 200) + (stripped.length > 200 ? '...' : '');

        // Extract hostname from URL (handle URLs without protocol)
        let hostname = urlInput;
        try {
          const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
          hostname = new URL(url).hostname;
        } catch (e) {
          // If URL parsing fails, use the input as-is
          hostname = urlInput.replace(/^https?:\/\//, '').split('/')[0];
        }

        // Save to database (don't add to job description - keep visual only)
        await saveContextItem({
          type: 'url_scrape',
          title: `Scraped: ${hostname}`,
          content: result.data.text,
          source_url: urlInput,
          summary: summary,
          metadata: {
            url: urlInput,
            success: true,
            timestamp: new Date().toISOString()
          }
        });

        setUrlInput('');
        setShowUrlDialog(false);
        toast.success('Website content added successfully!');
      } else {
        throw new Error(result.error || 'Failed to scrape website');
      }
    } catch (error) {
      console.error('URL scraping failed:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to scrape website';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Website took too long to load. Try a different URL or try again later.';
        } else if (error.message.includes('403') || error.message.includes('blocked')) {
          errorMessage = 'Website blocked our scraper. Some sites prevent automated access.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Page not found. Please check the URL and try again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Check your connection and try again.';
        }
      }

      toast.error(errorMessage, {
        description: 'Try copying and pasting the content manually if scraping fails.'
      });
    } finally {
      setIsScrapingUrl(false);
    }
  };

  // File upload with enhanced async processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File upload triggered:', { file: file?.name, userId });

    if (!file || !userId) {
      console.error('Missing file or userId:', { hasFile: !!file, userId });
      toast.error('Please select a file');
      return;
    }

    // Validate file
    const validation = DocumentProcessor.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file type');
      return;
    }

    setIsUploadingFile(true);
    try {
      console.log('Processing file with DocumentProcessor:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId: userId
      });

      const extractedText = await DocumentProcessor.processDocument({
        file,
        userId: userId || '',
        onProgress: (status) => {
          console.log('Processing status:', status);
          // Enhanced UI feedback with file-type awareness
          if (status.includes('timeout') || status.includes('failed')) {
            toast.error(status, { duration: 4000 });
          } else if (status.includes('complete')) {
            if (file.name.toLowerCase().endsWith('.docx')) {
              toast.success('✅ DOCX processed successfully with enhanced formatting!');
            } else {
              toast.success(status);
            }
          } else if (status.includes('🎯') || status.includes('DOCX')) {
            toast.info('⚡ Processing DOCX with optimized engine for best results...', { duration: 3000 });
          } else if (status.includes('📄') || status.includes('PDF')) {
            toast.info('📄 Processing PDF with multi-worker fallback system...', { duration: 3000 });
          } else if (status.includes('locally') || status.includes('Client')) {
            toast.info('📄 Processing locally for faster results...', { duration: 2500 });
          } else if (status.includes('Saving')) {
            toast.info('💾 Saving processed document...', { duration: 1500 });
          } else {
            toast.info(status, { duration: 2000 }); // Show brief progress updates
          }
        },
        onComplete: async (content) => {
          // Save to database (don't add to job description - keep visual only)
          await saveContextItem({
            type: 'file_upload',
            title: `Extracted from ${file.name}`,
            content: content,
            file_name: file.name,
            file_type: file.type,
            summary: content.substring(0, 200) + '...',
            metadata: {
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              success: true,
              timestamp: new Date().toISOString(),
              processing_method: 'client_side_with_server_fallback'
            }
          });

          // Enhanced success message based on file type
          if (file.name.toLowerCase().endsWith('.docx')) {
            toast.success('🎯 DOCX content extracted with enhanced formatting preservation!');
          } else if (file.name.toLowerCase().endsWith('.pdf')) {
            toast.success('📄 PDF content extracted with optimized text recognition!');
          } else {
            toast.success('✅ File content extracted and added!');
          }
        },
        onError: (error) => {
          throw new Error(error);
        }
      });
    } catch (error) {
      console.error('File upload failed:', error);

      // Provide more specific error messages for file uploads
      let errorMessage = 'Failed to process file';
      if (error instanceof Error) {
        // Check for specific error messages from the function
        if (error.message.includes('20MB') || error.message.includes('size')) {
          errorMessage = 'File is too large. Please try a smaller file (under 20MB).';
        } else if (error.message.includes('Unsupported file type') || error.message.includes('format')) {
          errorMessage = 'Unsupported file format. Try PDF, DOC, DOCX, TXT, JPG, or PNG files.';
        } else if (error.message.includes('API key') || error.message.includes('configured')) {
          errorMessage = 'AI processing service unavailable. Please try again later.';
        } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'File processing timed out. Please try a smaller file.';
        } else if (error.message.includes('Gemini') || error.message.includes('Google AI') || error.message.includes('400')) {
          // Special handling for DOCX files that fail due to Gemini API limitations
          if (file && file.name.toLowerCase().endsWith('.docx')) {
            errorMessage = 'DOCX processing temporarily unavailable. Please convert to PDF or try a different format.';
          } else {
            errorMessage = 'AI processing failed. Please try again or use a different file.';
          }
        } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
          errorMessage = 'File appears corrupted or invalid. Try a different file.';
        } else if (error.message !== 'Failed to process file') {
          // Use the specific error message from the function if it's informative
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        description: file && file.name.toLowerCase().endsWith('.docx')
          ? 'Try converting to PDF or use a different format for best results'
          : 'Supported formats: PDF, TXT, JPG, PNG work best'
      });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Perplexity web search
  const handlePerplexitySearch = async () => {
    if (!perplexityQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearchingPerplexity(true);
    try {
      console.log('Sending Perplexity query:', perplexityQuery);

      const data = await functionBridge.perplexitySearch({ query: perplexityQuery });
      const error = null;

      console.log('Perplexity response:', { data, error });

      if (error) {
        console.error('Cloud Function error:', error);
        throw error;
      }

      if (data?.choices?.[0]?.message?.content) {
        const searchContent = data.choices[0].message.content;

        // Extract citations from Perplexity response
        const citations = data.citations || [];

        // Save to database (don't add to job description - keep visual only)
        await saveContextItem({
          type: 'perplexity',
          title: `Search: ${perplexityQuery}`,
          content: searchContent,
          source_url: perplexityQuery, // Store query as source
          summary: searchContent.length > 150 ? searchContent.substring(0, 150) + '...' : searchContent,
          metadata: {
            query: perplexityQuery,
            citations: citations,
            success: true,
            timestamp: new Date().toISOString(),
            response_data: data
          }
        });

        setPerplexityQuery('');
        setShowPerplexityDialog(false);
        toast.success('Search results added successfully!');
      } else {
        throw new Error('No search results found');
      }
    } catch (error) {
      console.error('Perplexity search failed:', error);

      // Try to get the actual error message from the response
      let errorMessage = 'Failed to search';
      if (error && typeof error === 'object') {
        if ('message' in error && error.message && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // Log the full error for debugging
        console.log('Full error object:', JSON.stringify(error, null, 2));
      }

      toast.error(errorMessage);
    } finally {
      setIsSearchingPerplexity(false);
    }
  };

  // Location selection handler with stable reference
  const handleLocationSelect = useCallback(async (location: {
    formatted_address: string;
    place_id: string;
    geometry: any;
    address_components: any[];
  }) => {
    console.log('🎯 MinimalSearchForm.handleLocationSelect called with:', location);
    console.log('📋 Selected project:', selectedProject);
    console.log('🗂️ Context items count:', contextItems.length);

    // Prevent duplicate processing of the same location
    // Prevent rapid duplicate selections
    const currentTime = Date.now();
    const lastSelectionKey = `location_${location.formatted_address}`;
    const lastSelectionTime = sessionStorage.getItem(lastSelectionKey);

    if (lastSelectionTime && currentTime - parseInt(lastSelectionTime) < 2000) {
      console.log('🚫 Preventing duplicate location selection:', location.formatted_address);
      return;
    }

    sessionStorage.setItem(lastSelectionKey, currentTime.toString());

    // Clean up old entries after 5 seconds
    setTimeout(() => {
      sessionStorage.removeItem(lastSelectionKey);
    }, 5000);

    try {
      // Show loading state
      toast.loading('Adding location...', { id: 'location-add' });

      if (!selectedProject) {
        // Save without project association but warn user
        console.warn('No project selected - saving location as general context');
      }

      // Check if this location already exists as a context item
      const existingLocation = contextItems.find(item =>
        item.type === 'manual_input' &&
        item.title.includes(location.formatted_address)
      );

      if (existingLocation) {
        console.log('🔄 Location already exists as context item:', existingLocation);
        toast.success('Location already added to context', { id: 'location-add' });
        return;
      }

      // Parse location components for better context
      const parsedLocation = parseLocationComponents(location.address_components);
      const locationString = generateLocationString(parsedLocation);

      console.log('Parsed location:', parsedLocation);
      console.log('Location string:', locationString);

      // Save as context item for immediate use with location_input type
      const contextItem = await saveContextItem({
        type: 'manual_input',
        title: `Location: ${location.formatted_address}`,
        content: locationString,
        summary: `Search location set to ${location.formatted_address}`,
        metadata: {
          formatted_address: location.formatted_address,
          place_id: location.place_id,
          geometry: location.geometry,
          address_components: location.address_components,
          parsedLocation,
          selectedAt: new Date().toISOString(),
          projectId: selectedProject?.id || null,
          isLocationContext: true // Mark this as location context for easier filtering
        }
      });

      console.log('🗺️ Location context item created:', {
        id: contextItem?.id,
        type: contextItem?.type,
        title: contextItem?.title,
        hasMetadata: !!contextItem?.metadata,
        parsedLocation: contextItem?.metadata?.parsedLocation
      });

      console.log('Context item saved:', contextItem);

      if (contextItem) {
        toast.success(`Location "${location.formatted_address}" added to context`, { id: 'location-add' });
      } else {
        toast.error('Failed to save location', { id: 'location-add' });
      }

      setShowLocationDialog(false);

      // Success notification with project context
      if (selectedProject) {
        toast.success(
          `Location "${location.formatted_address}" added to project "${selectedProject.name}"`,
          {
            id: 'location-add',
            description: 'This location will be used for targeted boolean search generation'
          }
        );
      } else {
        toast.success(
          `Location "${location.formatted_address}" added as general context`,
          {
            id: 'location-add',
            description: 'Select a project to associate this location with a specific search'
          }
        );
      }
    } catch (error) {
      console.error('Location processing error:', error);
      toast.error('Failed to add location to project', { id: 'location-add' });
    }
  }, [selectedProject, contextItems, saveContextItem]);

  const loadContextItems = useCallback(async () => {
    if (!userId) return;

    setLoadingContext(true);
    try {
      let query = firestoreClient
        .from<ContextItem>('context_items')
        .select('*')
        .eq('user_id', userId);

      const projectId = selectedProject?.id || selectedProjectId;
      console.log('Loading context items for:', { userId, projectId, selectedProject: selectedProject?.name });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const normalized = Array.isArray(data) ? data : data ? [data] : [];
      const filtered = projectId
        ? normalized.filter(item => item.project_id === projectId)
        : normalized.filter(item => !item.project_id);

      const sortByCreatedAtDesc = (items: ContextItem[]) => {
        const getTimestamp = (value: any): number => {
          if (!value) return 0;
          if (value instanceof Date) return value.getTime();
          if (typeof value === 'string') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
          }
          if (typeof value === 'object') {
            if ('toDate' in value && typeof value.toDate === 'function') {
              return value.toDate().getTime();
            }
            if ('seconds' in value && typeof value.seconds === 'number') {
              const millis = value.seconds * 1000;
              const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds / 1_000_000 : 0;
              return millis + nanos;
            }
          }
          return 0;
        };

        return [...items].sort((a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at));
      };

      const sortedItems = sortByCreatedAtDesc(filtered);

      console.log('Context items loaded:', sortedItems);
      setContextItems(sortedItems.map(item => ({ ...item, isExpanded: false })));
    } catch (error) {
      console.error('Error loading context items:', error);
    } finally {
      setLoadingContext(false);
    }
  }, [userId, selectedProjectId, selectedProject?.id, selectedProject?.name]);

  const toggleContextExpansion = (id: string) => {
    setContextItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const removeContextItem = async (id: string) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await deleteDoc(doc(db, 'context_items', id));

      setContextItems(prev => prev.filter(item => item.id !== id));
      toast.success('Context item removed');
    } catch (error) {
      console.error('Error removing context item:', error);
      toast.error('Could not remove item. Please try again.');
    }
  };

  const clearAllContextItems = async () => {
    if (contextItems.length === 0) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to clear all ${contextItems.length} context item${contextItems.length !== 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      toast.loading('Clearing all context items...', { id: 'clear-all' });

      const deleteResult = await firestoreClient
        .from('context_items')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', selectedProject?.id || null);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Update local state
      setContextItems([]);
      toast.success('All context items cleared', { id: 'clear-all' });
    } catch (error) {
      console.error('Error clearing all context items:', error);
      toast.error('Could not clear items. Please try again.', { id: 'clear-all' });
    }
  };

  // Load context items when component mounts or project changes
  useEffect(() => {
    loadContextItems();
  }, [userId, selectedProjectId, selectedProject?.id, loadContextItems]);

  return {
    // Context state
    contextItems,
    setContextItems,
    loadingContext,

    // URL scraping
    urlInput,
    setUrlInput,
    isScrapingUrl,
    showUrlDialog,
    setShowUrlDialog,

    // Perplexity search
    perplexityQuery,
    setPerplexityQuery,
    isSearchingPerplexity,
    showPerplexityDialog,
    setShowPerplexityDialog,

    // File upload
    isUploadingFile,
    fileInputRef,

    // Location
    showLocationDialog,
    setShowLocationDialog,

    // Actions
    handleUrlScrape,
    handleFileUpload,
    handlePerplexitySearch,
    handleLocationSelect,
    saveContextItem,
    loadContextItems,
    toggleContextExpansion,
    removeContextItem,
    clearAllContextItems,
  };
}
