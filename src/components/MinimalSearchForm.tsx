import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CompactCandidateAnalysis } from '@/components/search/CompactCandidateAnalysis';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Sparkles, Copy, ExternalLink, Globe, Upload, Zap, Link, Eye, EyeOff, X, Lightbulb, MapPin, Grid3X3, List, Loader2, Mail, ArrowDown, ArrowUpDown, Filter, Download, CheckSquare, Square, Code, AlertTriangle, Users } from 'lucide-react';
import { SourceSelector } from '@/components/search/SourceSelector';
import { SourceTabs } from '@/components/search/SourceTabs';
import { DEFAULT_SOURCES, type CandidateSource, type SourceSearchResult } from '@/types/candidate-search';
import { ContainedLoading, ButtonLoading } from '@/components/ui/contained-loading';
import { toast } from 'sonner';
import BooleanExplainer from '@/components/BooleanExplainer';
import { functionBridge } from '@/lib/function-bridge';
import { BooleanExplanation } from '@/types/boolean-explanation';
import LocationModal from '@/components/LocationModal';
import { useProjectContext } from '@/context/ProjectContext';
import { BooleanGenerationAnimation } from '@/components/search/BooleanGenerationAnimation';
import { trackBooleanGeneration, trackCandidateSearch } from '@/lib/analytics';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { useSubscription } from '@/hooks/useSubscription';
import { useClarvidaUsageLimit } from '@/hooks/useClarvidaUsageLimit';
import { useClarvidaSubscription } from '@/hooks/useClarvidaSubscription';
import type { MinimalSearchFormProps, SearchResult } from '@/types/search-form';

// Extracted hooks
import { useContextManagement } from '@/components/search/hooks/useContextManagement';
import { useProfileActions } from '@/components/search/hooks/useProfileActions';

// Extracted components
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { ContextItemCard } from '@/components/search/ContextItemCard';
import { EmailTemplatesSection } from '@/components/search/EmailTemplatesSection';

export default function MinimalSearchForm({ userId, selectedProjectId, isClarvidaMode = false, initialBooleanString, initialJobTitle }: MinimalSearchFormProps) {
  const { selectedProject } = useProjectContext();

  // Usage limit hooks
  const standardUsageLimit = useUsageLimit();
  const clarvidaUsageLimit = useClarvidaUsageLimit();
  const standardSubscription = useSubscription();
  const clarvidaSubscription = useClarvidaSubscription();
  const { checkAndExecute, UsageLimitModalComponent, isLimitReached } = isClarvidaMode ? clarvidaUsageLimit : standardUsageLimit;
  const { incrementUsage } = isClarvidaMode ? clarvidaSubscription : standardSubscription;

  // Core input state (kept in parent - shared across hooks)
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState(initialJobTitle || '');
  const [booleanString, setBooleanString] = useState(initialBooleanString || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Sync initial values from workflow pipeline
  useEffect(() => { if (initialBooleanString) setBooleanString(initialBooleanString); }, [initialBooleanString]);
  useEffect(() => { if (initialJobTitle) setJobTitle(initialJobTitle); }, [initialJobTitle]);

  // Search state
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [selectedSources, setSelectedSources] = useState<CandidateSource[]>(DEFAULT_SOURCES);
  const [activeSourceTab, setActiveSourceTab] = useState<CandidateSource | 'all'>('all');
  const [sourceResults, setSourceResults] = useState<SourceSearchResult[]>([]);
  const [sourcesFailed, setSourcesFailed] = useState<CandidateSource[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'score' | 'location'>('default');
  const [filterBy, setFilterBy] = useState<'all' | 'analyzed' | 'enriched' | 'not-analyzed'>('all');

  // Boolean generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBooleanAnimation, setShowBooleanAnimation] = useState(false);
  const [requirementsCollapsed, setRequirementsCollapsed] = useState(false);
  const [booleanCollapsed, setBooleanCollapsed] = useState(false);

  // Boolean explanation state
  const [showExplanation, setShowExplanation] = useState(false);
  const [booleanExplanation, setBooleanExplanation] = useState<BooleanExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationCollapsed, setExplanationCollapsed] = useState(false);

  // Context management hook
  const ctx = useContextManagement({ userId, selectedProject, selectedProjectId });

  // Profile actions hook
  const profile = useProfileActions({
    searchResults,
    jobDescription,
    selectedProjectId,
    userId,
    booleanString,
    checkAndExecute,
    isLimitReached,
    incrementUsage,
  });

  // Filtered & sorted results
  const filteredResults = searchResults.map((result, index) => ({ result, index })).filter(({ result, index }) => {
    if (activeSourceTab !== 'all' && (result as any).source !== activeSourceTab) return false;
    if (filterBy === 'analyzed') return !!profile.analysisResults[index];
    if (filterBy === 'enriched') return !!profile.contactInfo[index];
    if (filterBy === 'not-analyzed') return !profile.analysisResults[index];
    return true;
  }).sort((a, b) => {
    if (sortBy === 'score') {
      return (profile.analysisResults[b.index]?.match_score ?? -1) - (profile.analysisResults[a.index]?.match_score ?? -1);
    }
    if (sortBy === 'location') return (a.result.location || '').localeCompare(b.result.location || '');
    return 0;
  });

  // Boolean search generation
  const generateBooleanSearch = async () => {
    if (!jobDescription.trim() && ctx.contextItems.length === 0) {
      toast.error('Please add context items or enter custom instructions to generate a boolean search');
      return;
    }
    setIsGenerating(true);
    setShowBooleanAnimation(true);
    try {
      const contextData = ctx.contextItems.map(item => ({
        type: item.type, title: item.title, content: item.content,
        summary: item.summary, source_url: item.source_url,
        file_name: item.file_name, metadata: item.metadata
      }));

      const projectContext = selectedProject ? {
        id: selectedProject.id, name: selectedProject.name,
        description: selectedProject.description, created_at: selectedProject.created_at
      } : null;

      const payload: any = {
        contextItems: contextData,
        jobTitle: jobTitle.trim() || undefined,
        projectContext, userId: userId || undefined
      };
      if (jobDescription.trim()) payload.description = jobDescription.trim();

      const result = await functionBridge.generateBooleanSearch(payload);
      if (!result.success) throw new Error(result.error || 'Failed to generate boolean search');

      if (result.searchString) {
        setBooleanString(result.searchString);
        setRequirementsCollapsed(true);
        if (jobDescription.trim() && ctx.contextItems.length > 0) {
          toast.success(`Boolean search generated from custom instructions + ${ctx.contextItems.length} context item(s)!`);
        } else if (ctx.contextItems.length > 0) {
          toast.success(`Boolean search generated from ${ctx.contextItems.length} context item(s)!`);
        } else {
          toast.success('Boolean search generated from custom instructions!');
        }
        trackBooleanGeneration(jobDescription, true);
      } else {
        throw new Error('No search string generated');
      }
    } catch (error) {
      console.error('Error generating boolean search:', error);
      toast.error('Could not generate search query. Please try again.');
      trackBooleanGeneration(jobDescription, false);
    } finally {
      setIsGenerating(false);
      setShowBooleanAnimation(false);
    }
  };

  // Boolean explanation
  const handleExplainBoolean = async () => {
    if (!booleanString.trim()) { toast.error('Please generate a boolean search string first'); return; }
    setIsExplaining(true);
    try {
      const data = await functionBridge.explainBoolean({
        booleanString, requirements: jobDescription.trim() || 'Boolean search explanation'
      });
      if (data) {
        const explanation = typeof data === 'string' ? JSON.parse(data) : data;
        setBooleanExplanation(explanation);
        setExplanationCollapsed(false);
        toast.success('Boolean search explained!');
      } else throw new Error('No explanation generated');
    } catch (error) {
      console.error('Error explaining boolean search:', error);
      toast.error('Could not explain search query. Please try again.');
    } finally { setIsExplaining(false); }
  };

  // Candidate search
  const searchCandidates = async (page = 1) => {
    if (!booleanString.trim()) { toast.error('Please generate or enter a boolean search string'); return; }
    if (page === 1) {
      if (isLimitReached('searches')) { await checkAndExecute('searches', async () => null); return; }
      setIsSearching(true);
      setActiveSourceTab('all');
    } else { setIsLoadingMore(true); }

    try {
      const locationContext = ctx.contextItems.find(item =>
        item.type === 'manual_input' && item.metadata?.isLocationContext
      );
      const location = locationContext?.content || undefined;

      const response = await functionBridge.candidateSearch({
        keywords: booleanString, sources: selectedSources, location, page,
        resultsPerSource: 10, useAIGeneration: false,
      });
      if (!response?.success) throw new Error(response?.error || 'Search failed');

      const { data } = response;
      setTotalSearchResults(data.metadata.totalFound);
      setSearchPage(page);
      setSourceResults(data.sources);
      setSourcesFailed(data.metadata.sourcesFailed || []);

      const mappedResults: SearchResult[] = data.merged.map((candidate: any) => ({
        title: `${candidate.name}${candidate.title ? ' | ' + candidate.title : ''}`,
        link: candidate.profileUrl,
        snippet: candidate.snippet,
        displayLink: candidate.profileUrl?.replace(/https?:\/\/(www\.)?/, '').split('/').slice(0, 2).join('/') || '',
        name: candidate.name || '', location: candidate.location || '',
        source: candidate.source, matchScore: candidate.matchScore,
        skills: candidate.skills, candidateName: candidate.name,
        candidateTitle: candidate.title, candidateCompany: candidate.company,
      }));

      if (page === 1) {
        setSearchResults(mappedResults);
        setBooleanCollapsed(true);
        const sourceInfo = data.metadata.sourcesSucceeded.length > 1 ? ` across ${data.metadata.sourcesSucceeded.length} sources` : '';
        toast.success(`Found ${data.metadata.totalFound} results${sourceInfo}`);
        incrementUsage('searches').catch(err => console.error('Failed to increment search usage:', err));
        if (data.metadata.sourcesFailed.length > 0) toast.warning(`Some sources failed: ${data.metadata.sourcesFailed.join(', ')}`);
      } else {
        setSearchResults(prev => [...prev, ...mappedResults]);
        toast.success(`Loaded ${mappedResults.length} more results`);
      }

      trackCandidateSearch('serper_multi', mappedResults.length, {
        sources: selectedSources.join(','),
        sourcesSucceeded: data.metadata.sourcesSucceeded.join(','),
        sourcesFailed: data.metadata.sourcesFailed.join(','),
        cached: data.metadata.cached ? 'yes' : 'no',
        booleanLength: booleanString.length.toString(),
      });
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search encountered an issue. Please try again.');
    } finally { setIsSearching(false); setIsLoadingMore(false); }
  };

  const loadMoreResults = () => {
    if (searchResults.length < totalSearchResults) searchCandidates(searchPage + 1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <TooltipProvider>
      <UsageLimitModalComponent />
      <div className="space-y-8 max-w-full mx-auto">
        {/* Step 1: Custom Instructions & Context */}
        <Collapsible open={!requirementsCollapsed} onOpenChange={(open) => setRequirementsCollapsed(!open)}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CollapsibleTrigger asChild>
              <div className="p-5 cursor-pointer group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Custom Instructions & Context</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Add requirements and context to improve search accuracy</p>
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    {requirementsCollapsed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {/* URL Scraper */}
                  <Dialog open={ctx.showUrlDialog} onOpenChange={ctx.setShowUrlDialog}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2 h-9 px-3.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-lg transition-colors">
                            <Link className="w-3.5 h-3.5" /><span className="text-sm">Scrape</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Scrape any website URL with Firecrawl AI</p></TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scrape Website Content</DialogTitle>
                        <DialogDescription>Enter a URL to scrape its content. Note: LinkedIn URLs cannot be scraped.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Enter website URL..." value={ctx.urlInput} onChange={(e) => ctx.setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ctx.handleUrlScrape(); }} />
                        <div className="flex gap-2">
                          <Button onClick={ctx.handleUrlScrape} disabled={!ctx.urlInput.trim() || ctx.isScrapingUrl} className="flex-1">
                            <ButtonLoading isLoading={ctx.isScrapingUrl} loadingText="Scraping..."><Globe className="w-4 h-4 mr-2" />Scrape & Add</ButtonLoading>
                          </Button>
                          <Button variant="outline" onClick={() => ctx.setShowUrlDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* File Upload */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 h-9 px-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg transition-colors disabled:opacity-50" onClick={() => ctx.fileInputRef.current?.click()} disabled={ctx.isUploadingFile}>
                        <ButtonLoading isLoading={ctx.isUploadingFile}><Upload className="w-3.5 h-3.5" /><span className="text-sm">Upload</span></ButtonLoading>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Upload and extract content locally</p></TooltipContent>
                  </Tooltip>
                  <input ref={ctx.fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.pptx,.jpg,.jpeg,.png" onChange={ctx.handleFileUpload} />

                  {/* Perplexity Search */}
                  <Dialog open={ctx.showPerplexityDialog} onOpenChange={ctx.setShowPerplexityDialog}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2 h-9 px-3.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 rounded-lg transition-colors">
                            <Sparkles className="w-3.5 h-3.5" /><span className="text-sm">Search</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Search the web with Perplexity AI</p></TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Perplexity Web Search</DialogTitle>
                        <DialogDescription>Search the web with Perplexity AI and add results to your context.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Enter search query..." value={ctx.perplexityQuery} onChange={(e) => ctx.setPerplexityQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ctx.handlePerplexitySearch(); }} />
                        <div className="flex gap-2">
                          <Button onClick={ctx.handlePerplexitySearch} disabled={!ctx.perplexityQuery.trim() || ctx.isSearchingPerplexity} className="flex-1">
                            <ButtonLoading isLoading={ctx.isSearchingPerplexity} loadingText="Searching..."><Zap className="w-4 h-4 mr-2" />Search & Add</ButtonLoading>
                          </Button>
                          <Button variant="outline" onClick={() => ctx.setShowPerplexityDialog(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Location */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 h-9 px-3.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg transition-colors" onClick={() => ctx.setShowLocationDialog(true)}>
                        <MapPin className="w-3.5 h-3.5" /><span className="text-sm">Location</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Add location context with Google Places</p></TooltipContent>
                  </Tooltip>
                </div>

                {/* Job Title */}
                <div className="space-y-1.5">
                  <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">
                    Job Title <span className="text-gray-400 text-xs">(optional but recommended)</span>
                  </label>
                  <Input id="job-title" type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior Software Engineer, Product Manager..." />
                  <p className="text-xs text-gray-500">Providing a job title helps generate more accurate boolean search strings</p>
                </div>

                <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Enter custom instructions or requirements (optional)..." className="min-h-[100px] mb-4" />

                {/* Context Items Grid */}
                {ctx.contextItems.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Context</h3>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ctx.contextItems.length}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={ctx.clearAllContextItems} className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8 px-3 border border-red-200 hover:border-red-300 transition-all">
                        <X className="w-3 h-3 mr-1" />Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      {ctx.contextItems.map((item) => (
                        <ContextItemCard key={item.id} item={item} onToggleExpansion={ctx.toggleContextExpansion} onRemove={ctx.removeContextItem} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-5">
                  <Button onClick={generateBooleanSearch} disabled={(!jobDescription.trim() && ctx.contextItems.length === 0) || isGenerating} className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-5 py-2">
                    <ButtonLoading isLoading={isGenerating && !showBooleanAnimation} loadingText="Generating..."><Sparkles className="w-4 h-4 mr-2" />Generate Boolean Search</ButtonLoading>
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Step 2: Boolean Search String */}
        {booleanString && (
          <Collapsible open={!booleanCollapsed} onOpenChange={(open) => setBooleanCollapsed(!open)}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CollapsibleTrigger asChild>
                <div className="p-5 cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0"><Code className="h-4 w-4 text-purple-600" /></div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Boolean Search String</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Edit and refine your generated search query</p>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      {booleanCollapsed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                  <div className="space-y-4">
                    <Textarea value={booleanString} onChange={(e) => setBooleanString(e.target.value)} className="font-mono min-h-[120px] resize-y" placeholder="Generated Boolean search string will appear here..." />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex gap-3">
                        <Button onClick={() => copyToClipboard(booleanString)} variant="outline" className="hover:bg-purple-50 hover:border-purple-300 transition-all">
                          <Copy className="w-4 h-4 mr-2" />Copy
                        </Button>
                        <Button onClick={handleExplainBoolean} variant="outline" disabled={isExplaining || !booleanString.trim()} className="hover:bg-purple-50 hover:border-purple-300 transition-all">
                          <ButtonLoading isLoading={isExplaining} loadingText="Analyzing..."><Lightbulb className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Explain This Search</span><span className="sm:hidden">Explain</span></ButtonLoading>
                        </Button>
                      </div>
                      <Button onClick={() => searchCandidates()} disabled={isSearching} className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200 sm:ml-auto">
                        <ButtonLoading isLoading={isSearching} loadingText="Searching..."><Search className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Search Candidates</span><span className="sm:hidden">Search</span></ButtonLoading>
                      </Button>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 mb-2">Search sources:</p>
                      <SourceSelector selectedSources={selectedSources} onSourcesChange={setSelectedSources} disabled={isSearching} />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Boolean Explanation */}
        {booleanExplanation && (
          <Collapsible open={!explanationCollapsed} onOpenChange={(open) => setExplanationCollapsed(!open)}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CollapsibleTrigger asChild>
                <div className="p-6 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg"><Lightbulb className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                      <h2 className="text-xl font-semibold text-indigo-900">Boolean Search Explanation</h2>
                      <p className="text-sm text-indigo-600">Understanding your search strategy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setShowExplanation(true); }} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition-colors" title="View in full screen"><ExternalLink className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setBooleanExplanation(null); }} className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition-colors" title="Remove explanation"><X className="w-4 h-4" /></Button>
                    <div className="transition-transform duration-200">{explanationCollapsed ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4 text-indigo-500" />}</div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-500 ease-in-out">
                <div className="mt-2"><BooleanExplainer explanation={booleanExplanation} /></div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Search Results */}
        {(searchResults.length > 0 || isSearching) && (
          <ContainedLoading isLoading={isSearching} loadingText={`Searching ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}...`} className="mb-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-6">
                {sourcesFailed.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Some sources failed: {sourcesFailed.join(', ')}. Showing results from successful sources.</span>
                  </div>
                )}
                <SourceTabs sources={sourceResults} activeTab={activeSourceTab} onTabChange={setActiveSourceTab} />

                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"><Search className="h-4 w-4 text-green-600" /></div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">Search Results ({filteredResults.length}{filteredResults.length !== searchResults.length ? ` of ${searchResults.length}` : ''})</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Select profiles to enrich and save</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      {!showAIAnalysis && (
                        <Button onClick={() => setShowAIAnalysis(true)} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
                          <Sparkles className="w-4 h-4 mr-1 lg:mr-2" /><span className="hidden sm:inline">Analyze</span> AI ({searchResults.length})
                        </Button>
                      )}
                      <div className="flex items-center border rounded-lg p-1">
                        <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-7 px-2"><Grid3X3 className="w-4 h-4" /></Button>
                        <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-7 px-2"><List className="w-4 h-4" /></Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={profile.toggleSelectAll} className="h-7 px-2 text-xs">
                        {profile.selectedProfiles.size === searchResults.length ? <><CheckSquare className="w-4 h-4 mr-1" /> Deselect All</> : <><Square className="w-4 h-4 mr-1" /> Select All</>}
                      </Button>
                      <Badge variant="outline" className="whitespace-nowrap">{profile.selectedProfiles.size} selected</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-gray-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Filter className="w-3.5 h-3.5" />
                        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as typeof filterBy)} className="text-xs border rounded px-1.5 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-purple-500">
                          <option value="all">All Results</option><option value="analyzed">Analyzed</option><option value="not-analyzed">Not Analyzed</option><option value="enriched">Has Contact</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="text-xs border rounded px-1.5 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-purple-500">
                          <option value="default">Default Order</option><option value="score">Match Score</option><option value="location">Location (A-Z)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={profile.batchAnalyze} disabled={profile.selectedProfiles.size === 0 || profile.isBatchAnalyzing} size="sm" variant="outline" className="h-7 px-2 text-xs whitespace-nowrap">
                        {profile.isBatchAnalyzing ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {profile.batchProgress.done}/{profile.batchProgress.total}</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Analyze Selected</>}
                      </Button>
                      <Button onClick={profile.batchEnrich} disabled={profile.selectedProfiles.size === 0 || profile.isBatchEnriching} size="sm" variant="outline" className="h-7 px-2 text-xs whitespace-nowrap">
                        {profile.isBatchEnriching ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {profile.batchProgress.done}/{profile.batchProgress.total}</> : <><Users className="w-3.5 h-3.5 mr-1" /> Enrich Selected</>}
                      </Button>
                      <Button onClick={profile.exportSelectedToCSV} disabled={profile.selectedProfiles.size === 0} size="sm" variant="outline" className="h-7 px-2 text-xs whitespace-nowrap"><Download className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">CSV</span></Button>
                      <Button onClick={profile.openEmailDialog} disabled={profile.selectedProfiles.size === 0} size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 whitespace-nowrap"><Mail className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Email</span></Button>
                    </div>
                  </div>
                </div>

                {/* Results Grid/List */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'} style={{ maxHeight: viewMode === 'grid' ? '800px' : 'none', overflowY: viewMode === 'grid' ? 'auto' : 'visible' }}>
                  {filteredResults.map(({ result, index }) => (
                    <SearchResultCard
                      key={index}
                      result={result}
                      index={index}
                      viewMode={viewMode}
                      isSelected={profile.selectedProfiles.has(index)}
                      analysis={profile.analysisResults[index]}
                      contact={profile.contactInfo[index]}
                      loadingAnalysis={profile.loadingAnalysis.has(index)}
                      loadingContact={profile.loadingContact.has(index)}
                      savedCandidate={profile.savedCandidates.has(index)}
                      savingCandidate={profile.savingCandidates.has(index)}
                      onToggleSelection={profile.toggleProfileSelection}
                      onAnalyze={profile.analyzeCandidate}
                      onGetContact={profile.getContactInfo}
                      onSave={profile.saveCandidate}
                      onEmail={(idx) => { if (!profile.selectedProfiles.has(idx)) profile.toggleProfileSelection(idx); setTimeout(() => profile.openEmailDialog(), 0); }}
                    />
                  ))}

                  {searchResults.length < totalSearchResults && searchPage < 10 && (
                    <div className="col-span-full flex flex-col items-center gap-2 py-6">
                      <p className="text-sm text-gray-500">Showing {searchResults.length} of {totalSearchResults} results</p>
                      <Button variant="outline" onClick={loadMoreResults} disabled={isLoadingMore} className="border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700">
                        {isLoadingMore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading more...</> : <><ArrowDown className="w-4 h-4 mr-2" />Load 10 More Results</>}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </ContainedLoading>
        )}

        {searchResults.length === 0 && booleanString && (
          <Card className="p-6 border-0 shadow-sm">
            <p className="text-center text-gray-500">Click "Search Candidates" to find candidates</p>
          </Card>
        )}

        {searchResults.length > 0 && showAIAnalysis && (
          <div className="mt-6">
            <CompactCandidateAnalysis
              candidates={searchResults}
              jobDescription={jobDescription}
              onCandidateSelect={(candidate) => {
                const index = searchResults.findIndex(r => r.link === candidate.link);
                if (index !== -1) profile.toggleProfileExpansion(index);
              }}
            />
          </div>
        )}

        {/* Email Generation Dialog */}
        <Dialog open={profile.showEmailDialog} onOpenChange={profile.setShowEmailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Email Templates</DialogTitle>
              <DialogDescription>Add context to personalize the email templates for selected candidates.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
                <Textarea placeholder="e.g., We're a fast-growing startup looking for someone passionate about AI/ML..." value={profile.emailContext} onChange={(e) => profile.setEmailContext(e.target.value)} className="min-h-[120px]" />
              </div>
              <div className="flex gap-2">
                <Button onClick={profile.generateEmailTemplates} disabled={profile.isGeneratingEmails} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Sparkles className="w-4 h-4 mr-2" />{profile.isGeneratingEmails ? 'Generating...' : 'Generate Email Templates'}
                </Button>
                <Button variant="outline" onClick={() => profile.setShowEmailDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generated Email Templates */}
        {profile.generatedEmails.length > 0 && (
          <EmailTemplatesSection
            emails={profile.generatedEmails}
            onClear={() => profile.setGeneratedEmails([])}
            onCopyToClipboard={copyToClipboard}
            onSendOutreach={profile.sendOutreach}
          />
        )}

        {/* Location Modal */}
        <LocationModal isOpen={ctx.showLocationDialog} onClose={() => ctx.setShowLocationDialog(false)} onLocationSelect={ctx.handleLocationSelect} />

        {/* Boolean Explanation Dialog */}
        <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Boolean Search Explanation</DialogTitle>
              <DialogDescription>Understanding what your search will find and why</DialogDescription>
            </DialogHeader>
            {booleanExplanation && <BooleanExplainer explanation={booleanExplanation} onClose={() => setShowExplanation(false)} variant="modal" />}
          </DialogContent>
        </Dialog>

        <BooleanGenerationAnimation isOpen={showBooleanAnimation} onComplete={() => setShowBooleanAnimation(false)} estimatedTimeMs={120000} />
      </div>
    </TooltipProvider>
  );
}
