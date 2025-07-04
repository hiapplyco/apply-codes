import React, { useState } from 'react';
import { X, Link2, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { FirecrawlService } from '../../utils/FirecrawlService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProjectContext } from '../../context/ProjectContext';

interface URLScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapedContent: (content: { text: string; rawContent: string; url: string }) => void;
  context?: string;
  projectId?: string;
}

export function URLScrapeModal({
  isOpen,
  onClose,
  onScrapedContent,
  context = 'general',
  projectId
}: URLScrapeModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ text: string; rawContent: string } | null>(null);
  const { selectedProject } = useProjectContext();
  
  // Use passed projectId or fall back to selected project
  const activeProjectId = projectId || selectedProject?.id;

  const handleScrape = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success && result.data) {
        setScrapedData({
          text: result.data.text,
          rawContent: result.data.rawContent
        });
        
        // Save to project if we have one
        if (activeProjectId) {
          await saveToProject(result.data.text, result.data.rawContent);
        }
        
        toast.success('Content scraped successfully!');
      } else {
        throw new Error(result.error || 'Failed to scrape content');
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      toast.error('Failed to scrape URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToProject = async (text: string, rawContent: string) => {
    if (!activeProjectId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save scraped data to project metadata
      const { error } = await supabase
        .from('project_scraped_data')
        .insert({
          project_id: activeProjectId,
          user_id: user.id,
          url,
          summary: text,
          raw_content: rawContent,
          context,
          metadata: {
            scraped_at: new Date().toISOString(),
            source: 'url_scraper'
          }
        });

      if (error) {
        console.error('Error saving to project:', error);
        // Don't throw - we still want to use the scraped content
      }
    } catch (error) {
      console.error('Error in saveToProject:', error);
    }
  };

  const handleUseContent = () => {
    if (scrapedData) {
      onScrapedContent({
        text: scrapedData.text,
        rawContent: scrapedData.rawContent,
        url
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setScrapedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Import from URL</h2>
              {activeProjectId && selectedProject && (
                <p className="text-sm text-gray-600">
                  Saving to project: {selectedProject.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!scrapedData ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Website URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/job-posting"
                      className="w-full bg-white text-black border-2 border-black rounded-lg px-4 py-3 pr-12 
                               focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                    />
                    <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter a URL to import content from any website
                  </p>
                </div>

                <button
                  onClick={handleScrape}
                  disabled={isLoading || !url}
                  className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg
                           border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           hover:scale-105 transition-transform duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           flex items-center justify-center gap-2"
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scraping content...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Scrape Content
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-black">Content Scraped Successfully</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-black mb-1">URL:</p>
                    <p className="text-sm text-gray-600 truncate">{url}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-black mb-1">Summary:</p>
                    <div className="bg-gray-50 border-2 border-gray-200 rounded p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {scrapedData.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUseContent}
                  className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg
                           border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           hover:scale-105 transition-transform duration-200"
                  type="button"
                >
                  Use This Content
                </button>
                <button
                  onClick={() => setScrapedData(null)}
                  className="flex-1 bg-gray-200 text-black font-bold py-3 rounded-lg
                           border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           hover:scale-105 transition-transform duration-200"
                  type="button"
                >
                  Scrape Another URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}