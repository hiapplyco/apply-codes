import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Link2,
  Sparkles,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain
} from 'lucide-react';
import { URLScrapeModal } from '@/components/url-scraper/URLScrapeModal';
import { PerplexitySearchModal } from '@/components/perplexity/PerplexitySearchModal';
import LocationModal from '@/components/LocationModal';
import { toast } from 'sonner';
import { ContextInputSectionProps } from './types';
import { DocumentProcessor } from '@/lib/modernPdfProcessor';

export function ContextInputSection({ onContextAdded, isExtracting }: ContextInputSectionProps) {
  const [pasteText, setPasteText] = useState('');
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [isFirecrawlOpen, setIsFirecrawlOpen] = useState(false);
  const [isPerplexityOpen, setIsPerplexityOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload with proper document processing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file using DocumentProcessor
    const validation = DocumentProcessor.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file type');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessing('file');
    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
      // Use DocumentProcessor for proper text extraction (PDF.js, mammoth, etc.)
      const extractedContent = await DocumentProcessor.processDocument({
        file,
        userId: 'context-builder', // Not storing to Firebase, just extracting
        onProgress: (message) => {
          toast.loading(message, { id: toastId });
        },
        onComplete: (content) => {
          console.log(`Successfully extracted ${content.length} characters from ${file.name}`);
        },
        onError: (error) => {
          console.error('Document processing error:', error);
        }
      });

      // Create a clean summary from the extracted content
      const cleanContent = extractedContent.trim();
      const summary = cleanContent
        .substring(0, 300)
        .replace(/\s+/g, ' ')
        .trim() + (cleanContent.length > 300 ? '...' : '');

      await onContextAdded({
        type: 'file_upload',
        title: `File: ${file.name}`,
        content: cleanContent,
        summary: summary,
        file_name: file.name,
        file_type: file.type,
        metadata: {
          fileSize: file.size,
          fileType: file.type,
          extractedLength: cleanContent.length,
          extractionMethod: file.type === 'application/pdf' ? 'pdf.js' :
                           file.type.includes('wordprocessingml') ? 'mammoth' : 'native'
        },
      });

      toast.success(`Extracted content from ${file.name}`, { id: toastId });
    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsProcessing(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle paste text submission
  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setIsProcessing('paste');
    try {
      await onContextAdded({
        type: 'manual_input',
        title: 'Pasted Job Description',
        content: pasteText,
        summary: pasteText.substring(0, 200) + (pasteText.length > 200 ? '...' : ''),
      });

      setPasteText('');
      setShowPasteInput(false);
      toast.success('Job description added');
    } catch (error) {
      console.error('Paste submit failed:', error);
      toast.error('Failed to add text');
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle Firecrawl URL scrape result
  const handleFirecrawlContent = async (content: { text: string; rawContent: string; url: string }) => {
    try {
      const hostname = new URL(content.url).hostname;
      await onContextAdded({
        type: 'url_scrape',
        title: `URL: ${hostname}`,
        content: content.text || content.rawContent,
        summary: (content.text || content.rawContent).substring(0, 200) + '...',
        source_url: content.url,
        metadata: { hostname, scrapedAt: new Date().toISOString() },
      });
      setIsFirecrawlOpen(false);
    } catch (error) {
      console.error('URL scrape processing failed:', error);
      toast.error('Failed to process scraped content');
    }
  };

  // Handle Perplexity search result
  const handlePerplexityResult = async (result: { text: string; query: string; searchId?: string }) => {
    try {
      await onContextAdded({
        type: 'perplexity_search',
        title: `Search: ${result.query.substring(0, 40)}${result.query.length > 40 ? '...' : ''}`,
        content: result.text,
        summary: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
        metadata: { query: result.query, searchId: result.searchId },
      });
      setIsPerplexityOpen(false);
    } catch (error) {
      console.error('Perplexity result processing failed:', error);
      toast.error('Failed to process search results');
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location: any) => {
    try {
      // Extract city and state from address components if available
      let city = '';
      let state = '';

      if (location.address_components) {
        for (const component of location.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
        }
      }

      await onContextAdded({
        type: 'location_input',
        title: `Location: ${location.formatted_address}`,
        content: `Job location: ${location.formatted_address}`,
        summary: location.formatted_address,
        metadata: {
          formatted_address: location.formatted_address,
          place_id: location.place_id,
          city,
          state,
          geometry: location.geometry,
        },
      });
      setIsLocationOpen(false);
    } catch (error) {
      console.error('Location processing failed:', error);
      toast.error('Failed to add location');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Add Context
        </h3>
        {isExtracting && (
          <span className="text-sm text-purple-600 flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Extracting job details...
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Add job posting content from any source. AI will automatically extract and fill the form fields.
      </p>

      {/* 5 Input Method Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing === 'file' || isExtracting}
          className="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600"
        >
          {isProcessing === 'file' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Upload File
        </Button>

        {/* Paste Text Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowPasteInput(!showPasteInput)}
          className="border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500"
        >
          <FileText className="w-4 h-4 mr-2" />
          Paste Text
          {showPasteInput ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </Button>

        {/* Firecrawl URL */}
        <Button
          variant="outline"
          onClick={() => setIsFirecrawlOpen(true)}
          disabled={isExtracting}
          className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600"
        >
          <Link2 className="w-4 h-4 mr-2" />
          Scrape URL
        </Button>

        {/* Perplexity Search */}
        <Button
          variant="outline"
          onClick={() => setIsPerplexityOpen(true)}
          disabled={isExtracting}
          className="border-2 border-purple-500 text-purple-700 hover:bg-purple-50 hover:border-purple-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Search
        </Button>

        {/* Location */}
        <Button
          variant="outline"
          onClick={() => setIsLocationOpen(true)}
          disabled={isExtracting}
          className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:border-amber-600"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Location
        </Button>
      </div>

      {/* Expandable Paste Textarea */}
      {showPasteInput && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste job description text here... This can be from a job posting, email, or any source."
            rows={8}
            className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setPasteText('');
                setShowPasteInput(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim() || isProcessing === 'paste'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing === 'paste' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Add & Extract
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <URLScrapeModal
        isOpen={isFirecrawlOpen}
        onClose={() => setIsFirecrawlOpen(false)}
        onScrapedContent={handleFirecrawlContent}
        context="job-posting"
      />

      <PerplexitySearchModal
        isOpen={isPerplexityOpen}
        onClose={() => setIsPerplexityOpen(false)}
        onSearchResult={handlePerplexityResult}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}

export default ContextInputSection;
