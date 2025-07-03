import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Sparkles, Copy, ExternalLink, Globe, Upload, Zap, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FirecrawlService } from '@/utils/FirecrawlService';

interface MinimalSearchFormProps {
  userId: string | null;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
}

export default function MinimalSearchForm({ userId }: MinimalSearchFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [booleanString, setBooleanString] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());
  
  // Input method states
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [perplexityQuery, setPerplexityQuery] = useState('');
  const [isSearchingPerplexity, setIsSearchingPerplexity] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showPerplexityDialog, setShowPerplexityDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to append content to job description
  const appendToJobDescription = (newContent: string) => {
    const separator = jobDescription.trim() ? '\n\n---\n\n' : '';
    setJobDescription(prev => prev + separator + newContent);
  };

  // Firecrawl URL scraping
  const handleUrlScrape = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsScrapingUrl(true);
    try {
      const result = await FirecrawlService.crawlWebsite(urlInput, {
        context: 'sourcing',
        saveToProject: false
      });

      if (result.success && result.data?.text) {
        appendToJobDescription(`[Scraped from ${urlInput}]\n${result.data.text}`);
        setUrlInput('');
        setShowUrlDialog(false);
        toast.success('Website content added successfully!');
      } else {
        throw new Error(result.error || 'Failed to scrape website');
      }
    } catch (error) {
      console.error('URL scraping failed:', error);
      toast.error('Failed to scrape website');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  // File upload with Gemini extraction
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) {
      toast.error('Please select a file');
      return;
    }

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const { data, error } = await supabase.functions.invoke('parse-document', {
        body: formData,
      });

      if (error) throw error;

      if (data?.success && data?.text) {
        appendToJobDescription(`[Extracted from ${file.name}]\n${data.text}`);
        toast.success('File content extracted and added!');
      } else {
        throw new Error(data?.message || 'Failed to extract file content');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to process file');
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
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: { query: perplexityQuery },
      });

      if (error) throw error;

      if (data?.choices?.[0]?.message?.content) {
        appendToJobDescription(`[Perplexity search: "${perplexityQuery}"]\n${data.choices[0].message.content}`);
        setPerplexityQuery('');
        setShowPerplexityDialog(false);
        toast.success('Search results added successfully!');
      } else {
        throw new Error('No search results found');
      }
    } catch (error) {
      console.error('Perplexity search failed:', error);
      toast.error('Failed to search');
    } finally {
      setIsSearchingPerplexity(false);
    }
  };

  const generateBooleanSearch = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: { content: jobDescription }
      });

      if (error) throw error;

      if (data?.boolean_search) {
        setBooleanString(data.boolean_search);
        toast.success('Boolean search generated successfully!');
      }
    } catch (error) {
      console.error('Error generating boolean search:', error);
      toast.error('Failed to generate boolean search');
    } finally {
      setIsGenerating(false);
    }
  };

  const searchGoogle = async () => {
    if (!booleanString.trim()) {
      toast.error('Please generate or enter a boolean search string');
      return;
    }

    setIsSearching(true);
    try {
      // Get the API key from Supabase edge function (same as original implementation)
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-google-api-key');
      
      if (keyError || !keyData?.key) {
        throw new Error('Failed to get API key');
      }

      const searchQuery = `${booleanString} site:linkedin.com/in/`;
      const cseId = keyData.debug?.cseId || 'b28705633bcb44cf0';
      
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${keyData.key}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      if (data.items) {
        setSearchResults(data.items.slice(0, 10));
        toast.success(`Found ${data.items.length} results`);
      } else {
        setSearchResults([]);
        toast.info('No results found');
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const enrichProfile = async (profileUrl: string): Promise<ContactInfo | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('enrich-profile', {
        body: { linkedin_url: profileUrl }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enriching profile:', error);
      return null;
    }
  };

  const toggleProfileSelection = (index: number) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProfiles(newSelected);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const generateEmailPrompt = () => {
    const selectedResults = searchResults.filter((_, index) => selectedProfiles.has(index));
    if (selectedResults.length === 0) {
      toast.error('Please select some profiles first');
      return;
    }

    const emailPrompt = `Draft a professional recruiting email for the following candidates:

${selectedResults.map((result, index) => `
${index + 1}. ${result.title}
   LinkedIn: ${result.link}
   Background: ${result.snippet}
`).join('')}

Job Description: ${jobDescription}

Please create personalized outreach messages for each candidate.`;

    copyToClipboard(emailPrompt);
    toast.success('Email prompt copied to clipboard!');
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <div>
          <h1 className="text-3xl font-bold text-purple-600 mb-2">Boolean Search Generator</h1>
          <p className="text-gray-600">
            Generate boolean search strings and find candidates with Google Search + Nymeria enrichment
          </p>
        </div>

        {/* Job Description Input with Input Methods */}
        <Card className="p-6 border-2 border-gray-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">1. Enter Job Description</h2>
            <div className="flex gap-2">
              {/* URL Scraper Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Globe className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scrape Website Content</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter website URL..."
                          value={urlInput}
                          onChange={(event) => setUrlInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handleUrlScrape();
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUrlScrape}
                            disabled={!urlInput.trim() || isScrapingUrl}
                            className="flex-1"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            {isScrapingUrl ? 'Scraping...' : 'Scrape & Add'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowUrlDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scrape website content with Firecrawl</p>
                </TooltipContent>
              </Tooltip>

              {/* File Upload Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload file and extract content with Gemini AI</p>
                </TooltipContent>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />

              {/* Perplexity Search Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={showPerplexityDialog} onOpenChange={setShowPerplexityDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Zap className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Perplexity Web Search</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter search query..."
                          value={perplexityQuery}
                          onChange={(event) => setPerplexityQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              handlePerplexitySearch();
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handlePerplexitySearch}
                            disabled={!perplexityQuery.trim() || isSearchingPerplexity}
                            className="flex-1"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            {isSearchingPerplexity ? 'Searching...' : 'Search & Add'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowPerplexityDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search the web with Perplexity Sonar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste your job description here..."
            className="min-h-[120px] mb-4"
          />
          
          <Button
            onClick={generateBooleanSearch}
            disabled={!jobDescription.trim() || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Boolean Search'}
          </Button>
        </Card>

      {/* Boolean Search String */}
      {booleanString && (
        <Card className="p-6 border-2 border-purple-400 bg-purple-50">
          <h2 className="text-xl font-semibold mb-4">2. Boolean Search String</h2>
          <div className="space-y-4">
            <Input
              value={booleanString}
              onChange={(event) => setBooleanString(event.target.value)}
              className="font-mono"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(booleanString)}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={searchGoogle}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search LinkedIn Profiles'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="p-6 border-2 border-green-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">3. Search Results ({searchResults.length})</h2>
            <div className="space-x-2">
              <Badge variant="outline">{selectedProfiles.size} selected</Badge>
              <Button
                onClick={generateEmailPrompt}
                disabled={selectedProfiles.size === 0}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Email Prompt
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedProfiles.has(index)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => toggleProfileSelection(index)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-600 hover:underline">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                    <p className="text-xs text-gray-500 mt-2">{result.displayLink}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {searchResults.length === 0 && booleanString && (
        <Card className="p-6 border-2 border-gray-300">
          <p className="text-center text-gray-500">
            Click "Search LinkedIn Profiles" to find candidates
          </p>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}