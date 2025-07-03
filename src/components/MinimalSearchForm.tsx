import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Search, Sparkles, Copy, ExternalLink, Globe, Upload, Zap, Plus, Link, Save, CheckCircle, Eye, EyeOff, X, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FirecrawlService } from '@/utils/FirecrawlService';

interface MinimalSearchFormProps {
  userId: string | null;
  selectedProjectId?: string | null;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  location?: string;
}

interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
}

interface ContextItem {
  id: string;
  type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input';
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  file_name?: string;
  file_type?: string;
  created_at: string;
  metadata?: Record<string, any>;
  isExpanded?: boolean;
}

// Helper function to extract location from LinkedIn snippet
const extractLocationFromSnippet = (snippet: string): string | undefined => {
  // Common location patterns in LinkedIn snippets
  const locationPatterns = [
    // "at Company in Location" or "at Company, Location"
    /at\s+[^,]+(?:,\s*|\s+in\s+)([^•·|]+?)(?:\s*[•·|]|$)/i,
    // "Location Area" or "Location Metropolitan Area"
    /([^•·|]+?)\s*(?:Area|Metropolitan Area|Metro)(?:\s*[•·|]|$)/i,
    // "City, State" or "City, Country"
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)(?:\s*[•·|]|$)/,
    // "Location" followed by separator
    /([^•·|]+?)(?:\s*[•·|]|$)/
  ];

  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common non-location phrases
      const excludePatterns = [
        /\b(experience|years|developer|engineer|manager|director|senior|junior|lead|head|chief|president|ceo|cto|cfo|vp|vice|consulting|solutions|services|technologies|technology|systems|software|data|analytics|marketing|sales|operations|product|design|strategy|business|corporate|global|international|remote|freelance|consultant|contractor|full.time|part.time|seeking|looking|available|linkedin|member|profile|summary|about|skills|education|university|college|degree|bachelor|master|phd|doctorate|certified|certification|award|achievement|honor|volunteer|charity|nonprofit|organization|company|corporation|inc|llc|ltd|co|group|team|department|division|unit|branch|office|headquarters|hq|location|based|working|work|job|career|professional|expert|specialist|analyst|coordinator|associate|assistant|intern|trainee|student|graduate|alumni|member|board|committee|council|advisory|founder|owner|partner|shareholder|investor|client|customer|contact|connect|network|follow|endorse|recommend|reference|testimonial|feedback|review|rating|score|rank|top|best|leading|premier|award.winning|recognized|featured|published|speaker|author|writer|blogger|contributor|editor|journalist|reporter|anchor|host|presenter|moderator|panelist|judge|mentor|coach|trainer|instructor|teacher|professor|lecturer|researcher|scientist|engineer|developer|programmer|coder|architect|designer|artist|creative|innovator|entrepreneur|startup|venture|capital|funding|investment|acquisition|merger|partnership|collaboration|alliance|joint|venture|project|initiative|program|campaign|launch|release|announcement|news|update|press|media|social|digital|online|web|mobile|app|platform|solution|product|service|tool|technology|software|hardware|system|network|cloud|data|analytics|intelligence|machine|learning|artificial|ai|automation|robotics|iot|blockchain|cryptocurrency|fintech|healthtech|biotech|cleantech|greentech|sustainability|environment|climate|energy|renewable|solar|wind|electric|battery|automotive|transportation|logistics|supply|chain|manufacturing|production|construction|real|estate|property|retail|ecommerce|marketplace|platform|saas|paas|iaas|b2b|b2c|b2g|enterprise|small|medium|large|fortune|public|private|government|federal|state|local|municipal|county|city|town|village|rural|urban|suburban|metro|region|area|zone|district|sector|industry|vertical|horizontal|niche|market|segment|demographic|audience|user|customer|client|consumer|buyer|seller|vendor|supplier|partner|distributor|reseller|retailer|wholesaler|manufacturer|producer|creator|maker|builder|developer|designer|consultant|advisor|expert|specialist|analyst|manager|director|executive|leader|founder|owner|operator|administrator|coordinator|supervisor|overseer|controller|auditor|inspector|evaluator|assessor|reviewer|approver|decision|maker|stakeholder|influencer|advocate|champion|evangelist|ambassador|representative|spokesperson|liaison|contact|point|person|individual|team|group|department|division|unit|branch|office|facility|site|location|address|phone|email|website|url|link|social|media|linkedin|twitter|facebook|instagram|youtube|github|portfolio|resume|cv|bio|profile|summary|about|description|overview|introduction|background|history|story|journey|path|career|experience|expertise|skills|knowledge|competency|capability|ability|talent|strength|qualification|credential|certification|license|degree|education|training|course|workshop|seminar|conference|event|meetup|networking|community|association|organization|society|club|group|forum|discussion|conversation|dialogue|exchange|interaction|engagement|participation|involvement|contribution|collaboration|cooperation|partnership|alliance|relationship|connection|network|contact|reference|recommendation|endorsement|testimonial|review|feedback|rating|score|evaluation|assessment|appraisal|performance|achievement|accomplishment|success|milestone|goal|objective|target|metric|kpi|roi|revenue|profit|growth|expansion|scale|size|volume|quantity|quality|standard|benchmark|best|practice|methodology|approach|strategy|tactic|technique|method|process|procedure|workflow|system|framework|model|structure|architecture|design|pattern|template|blueprint|plan|roadmap|timeline|schedule|deadline|milestone|phase|stage|step|task|activity|action|item|element|component|part|piece|section|chapter|module|unit|lesson|topic|subject|theme|category|type|kind|sort|variety|option|choice|alternative|solution|answer|response|reply|result|outcome|output|deliverable|artifact|document|report|analysis|study|research|investigation|survey|poll|questionnaire|interview|focus|group|usability|testing|quality|assurance|qa|qc|control|management|governance|compliance|regulation|policy|procedure|standard|guideline|rule|law|requirement|specification|criteria|condition|constraint|limitation|restriction|assumption|dependency|risk|issue|problem|challenge|obstacle|barrier|blocker|bottleneck|pain|point|gap|opportunity|potential|possibility|chance|probability|likelihood|certainty|uncertainty|ambiguity|clarity|transparency|visibility|accountability|responsibility|ownership|authority|power|influence|impact|effect|consequence|implication|significance|importance|priority|urgency|criticality|severity|magnitude|scale|scope|range|extent|depth|breadth|width|height|length|size|dimension|measurement|quantity|amount|number|count|total|sum|average|mean|median|mode|minimum|maximum|range|variance|deviation|distribution|frequency|rate|ratio|percentage|proportion|share|portion|fraction|segment|slice|part|piece|component|element|factor|variable|parameter|attribute|property|characteristic|feature|aspect|dimension|facet|angle|perspective|viewpoint|opinion|belief|attitude|sentiment|feeling|emotion|mood|tone|style|approach|manner|way|method|technique|strategy|tactic|plan|scheme|program|project|initiative|campaign|effort|endeavor|undertaking|venture|enterprise|business|operation|activity|function|role|responsibility|duty|task|job|assignment|mission|purpose|goal|objective|target|aim|intention|plan|strategy|vision|mission|values|culture|philosophy|principles|beliefs|ethics|morals|standards|guidelines|rules|policies|procedures|processes|systems|structures|frameworks|models|patterns|templates|blueprints|designs|architectures|solutions|products|services|offerings|portfolio|catalog|inventory|stock|supply|demand|market|competition|competitor|rival|alternative|substitute|replacement|upgrade|improvement|enhancement|optimization|refinement|innovation|creativity|originality|uniqueness|differentiation|advantage|benefit|value|utility|usefulness|relevance|applicability|suitability|appropriateness|fitness|match|alignment|compatibility|integration|interoperability|connectivity|communication|interaction|interface|api|protocol|standard|format|specification|documentation|manual|guide|tutorial|help|support|assistance|service|maintenance|repair|fix|solution|troubleshooting|debugging|testing|validation|verification|confirmation|assurance|guarantee|warranty|insurance|protection|security|safety|risk|management|mitigation|prevention|avoidance|reduction|minimization|elimination|control|monitoring|tracking|measurement|analysis|evaluation|assessment|audit|review|inspection|examination|investigation|research|study|survey|poll|questionnaire|interview|discussion|conversation|dialogue|meeting|conference|call|session|workshop|seminar|training|course|class|lesson|lecture|presentation|demonstration|show|exhibition|display|showcase|feature|highlight|emphasis|focus|attention|interest|curiosity|engagement|participation|involvement|contribution|input|feedback|comment|suggestion|recommendation|advice|guidance|direction|instruction|command|order|request|demand|requirement|need|want|desire|wish|hope|expectation|anticipation|prediction|forecast|projection|estimate|calculation|computation|analysis|evaluation|assessment|judgment|decision|choice|selection|option|alternative|solution|answer|response|reply|result|outcome|output|product|deliverable|artifact|document|file|record|data|information|knowledge|intelligence|insight|understanding|comprehension|awareness|recognition|realization|discovery|finding|conclusion|summary|synopsis|abstract|overview|introduction|background|context|setting|environment|situation|circumstance|condition|state|status|position|location|place|site|venue|facility|building|structure|construction|architecture|design|layout|plan|blueprint|diagram|chart|graph|table|list|menu|catalog|directory|index|reference|guide|manual|handbook|documentation|specification|standard|protocol|format|template|pattern|model|framework|system|platform|solution|tool|utility|application|software|program|code|script|function|method|procedure|process|workflow|pipeline|chain|sequence|series|set|collection|group|cluster|bundle|package|suite|kit|toolkit|library|repository|database|storage|archive|backup|copy|duplicate|version|revision|update|upgrade|improvement|enhancement|modification|change|alteration|adjustment|customization|configuration|setup|installation|deployment|implementation|execution|operation|function|performance|behavior|action|activity|process|task|job|work|effort|labor|service|duty|responsibility|obligation|commitment|promise|agreement|contract|deal|arrangement|partnership|collaboration|cooperation|alliance|relationship|connection|association|affiliation|membership|participation|involvement|engagement|interaction|communication|correspondence|exchange|dialogue|conversation|discussion|meeting|conference|call|session|event|occasion|gathering|assembly|convention|symposium|summit|forum|panel|debate|presentation|speech|talk|lecture|seminar|workshop|training|course|class|lesson|tutorial|demonstration|exhibition|show|display|performance|concert|festival|celebration|party|reception|dinner|lunch|breakfast|meal|food|drink|beverage|entertainment|recreation|leisure|hobby|interest|passion|enthusiasm|excitement|joy|happiness|satisfaction|pleasure|enjoyment|fun|amusement|humor|comedy|laughter|smile|cheer|celebration|success|achievement|accomplishment|victory|win|triumph|conquest|mastery|expertise|skill|talent|ability|capability|competence|proficiency|knowledge|understanding|wisdom|intelligence|insight|intuition|instinct|judgment|decision|choice|selection|preference|option|alternative|possibility|opportunity|chance|probability|likelihood|potential|capacity|power|strength|force|energy|vigor|vitality|health|wellness|fitness|condition|state|status|situation|circumstance|environment|context|setting|background|history|past|present|future|time|period|duration|length|span|interval|gap|break|pause|rest|stop|end|finish|completion|conclusion|result|outcome|consequence|effect|impact|influence|significance|importance|meaning|purpose|reason|cause|source|origin|beginning|start|initiation|launch|introduction|creation|development|growth|expansion|progress|advancement|improvement|enhancement|optimization|refinement|evolution|transformation|change|modification|alteration|adjustment|adaptation|customization|personalization|individualization|specialization|differentiation|distinction|uniqueness|originality|creativity|innovation|invention|discovery|breakthrough|achievement|success|victory|triumph|accomplishment|milestone|goal|objective|target|aim|purpose|mission|vision|dream|aspiration|ambition|desire|wish|hope|expectation|anticipation|prediction|forecast|projection|plan|strategy|approach|method|technique|procedure|process|system|framework|model|pattern|structure|organization|arrangement|configuration|setup|design|architecture|blueprint|template|format|standard|specification|protocol|rule|guideline|principle|policy|procedure|practice|habit|routine|custom|tradition|convention|norm|standard|benchmark|measure|metric|indicator|signal|sign|symptom|evidence|proof|demonstration|example|instance|case|scenario|situation|circumstance|condition|state|status|position|location|place|site|venue|destination|target|goal|objective|endpoint|finish|completion|conclusion|result|outcome|output|product|deliverable|artifact|creation|work|piece|item|object|thing|entity|element|component|part|section|segment|portion|share|fraction|percentage|proportion|ratio|rate|frequency|occurrence|instance|event|incident|episode|situation|circumstance|condition|state|status|phase|stage|step|level|degree|extent|amount|quantity|number|count|total|sum|aggregate|collection|group|set|series|sequence|chain|line|row|column|list|array|table|matrix|grid|network|web|structure|system|organization|entity|body|unit|division|department|section|branch|office|facility|site|location|address|contact|information|details|particulars|specifics|data|facts|figures|statistics|numbers|measurements|dimensions|size|scale|scope|range|extent|breadth|width|depth|height|length|distance|space|area|volume|capacity|limit|boundary|border|edge|margin|perimeter|circumference|diameter|radius|center|middle|core|heart|essence|substance|material|matter|content|subject|topic|theme|issue|problem|question|query|inquiry|investigation|research|study|analysis|examination|review|evaluation|assessment|appraisal|judgment|opinion|view|perspective|angle|approach|stance|position|attitude|sentiment|feeling|emotion|mood|tone|atmosphere|ambiance|environment|setting|context|background|situation|circumstance|condition|state|status|phase|stage|period|time|moment|instant|second|minute|hour|day|week|month|year|decade|century|millennium|era|age|epoch|generation|lifetime|lifespan|duration|length|span|interval|gap|break|pause|rest|stop|halt|interruption|suspension|delay|postponement|deferment|extension|prolongation|continuation|persistence|endurance|stamina|strength|power|force|energy|vigor|vitality|health|wellness|fitness|condition|shape|form|appearance|look|aspect|feature|characteristic|quality|property|attribute|trait|mark|sign|symbol|indicator|signal|clue|hint|suggestion|implication|meaning|significance|importance|relevance|value|worth|merit|benefit|advantage|profit|gain|return|reward|compensation|payment|salary|wage|income|earnings|revenue|profit|surplus|excess|abundance|plenty|wealth|richness|prosperity|success|achievement|accomplishment|victory|triumph|conquest|mastery|dominance|superiority|excellence|perfection|quality|standard|level|grade|rank|position|status|standing|reputation|image|brand|identity|character|personality|nature|essence|spirit|soul|heart|mind|brain|intelligence|wisdom|knowledge|understanding|comprehension|awareness|consciousness|realization|recognition|acknowledgment|acceptance|approval|agreement|consent|permission|authorization|license|permit|certificate|credential|qualification|degree|diploma|award|honor|prize|trophy|medal|recognition|appreciation|gratitude|thanks|acknowledgment|credit|praise|compliment|flattery|admiration|respect|esteem|regard|consideration|attention|interest|curiosity|fascination|attraction|appeal|charm|beauty|elegance|grace|style|fashion|trend|mode|manner|way|method|approach|technique|strategy|tactic|plan|scheme|program|project|initiative|campaign|effort|endeavor|undertaking|venture|enterprise|business|operation|activity|function|role|responsibility|duty|task|job|assignment|mission|purpose|goal|objective|target|aim|intention|plan|strategy|vision|mission|values|culture|philosophy|principles|beliefs|ethics|morals|standards|guidelines|rules|policies|procedures|processes|systems|structures|frameworks|models|patterns|templates|blueprints|designs|architectures|solutions|products|services|offerings|portfolio)/i
      ];
      
      if (excludePatterns.some(pattern => pattern.test(location))) {
        continue;
      }
      
      // Clean up the location string
      return location
        .replace(/\s+/g, ' ')
        .replace(/[•·|]/g, '')
        .trim();
    }
  }
  
  return undefined;
};

export default function MinimalSearchForm({ userId, selectedProjectId }: MinimalSearchFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [booleanString, setBooleanString] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());
  const [expandedProfiles, setExpandedProfiles] = useState<Set<number>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<{[key: number]: any}>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<number>>(new Set());
  const [contactInfo, setContactInfo] = useState<{[key: number]: ContactInfo}>({});
  const [loadingContact, setLoadingContact] = useState<Set<number>>(new Set());
  const [savedCandidates, setSavedCandidates] = useState<Set<number>>(new Set());
  const [savingCandidates, setSavingCandidates] = useState<Set<number>>(new Set());
  
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
        appendToJobDescription(`[Scraped from ${urlInput}]\n${result.data.text}`);
        
        // Save to database
        await saveContextItem({
          type: 'url_scrape',
          title: result.data.title || `Scraped from ${urlInput}`,
          content: result.data.text,
          source_url: urlInput,
          summary: result.data.summary,
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
        
        // Save to database
        await saveContextItem({
          type: 'file_upload',
          title: `Extracted from ${file.name}`,
          content: data.text,
          file_name: file.name,
          file_type: file.type,
          summary: data.summary,
          metadata: {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            success: true,
            timestamp: new Date().toISOString()
          }
        });
        
        toast.success('File content extracted and added!');
      } else {
        throw new Error(data?.message || 'Failed to extract file content');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      
      // Provide more specific error messages for file uploads
      let errorMessage = 'Failed to process file';
      if (error instanceof Error) {
        if (error.message.includes('size') || error.message.includes('large')) {
          errorMessage = 'File is too large. Please try a smaller file (under 10MB).';
        } else if (error.message.includes('format') || error.message.includes('type')) {
          errorMessage = 'Unsupported file format. Try PDF, Word, or image files.';
        } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
          errorMessage = 'File appears corrupted or invalid. Try a different file.';
        }
      }
      
      toast.error(errorMessage, {
        description: 'Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG'
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
      
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: { query: perplexityQuery },
      });

      console.log('Perplexity response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.choices?.[0]?.message?.content) {
        const searchContent = data.choices[0].message.content;
        appendToJobDescription(`[Perplexity search: "${perplexityQuery}"]\n${searchContent}`);
        
        // Save to database
        await saveContextItem({
          type: 'perplexity_search',
          title: `Perplexity search: "${perplexityQuery}"`,
          content: searchContent,
          source_url: perplexityQuery, // Store query as source
          summary: searchContent.length > 500 ? searchContent.substring(0, 500) + '...' : searchContent,
          metadata: {
            query: perplexityQuery,
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

  const generateBooleanSearch = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare context items for the edge function
      const contextData = contextItems.map(item => ({
        type: item.type,
        title: item.title,
        content: item.content,
        summary: item.summary,
        source_url: item.source_url,
        file_name: item.file_name
      }));

      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: { 
          description: jobDescription,
          contextItems: contextData
        }
      });

      if (error) throw error;

      if (data?.searchString) {
        setBooleanString(data.searchString);
        toast.success('Boolean search generated successfully!');
      } else {
        throw new Error('No search string generated');
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
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-google-cse-key');
      
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
        // Map Google search results to SearchResult objects with location extraction
        const mappedResults: SearchResult[] = data.items.slice(0, 10).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
          location: extractLocationFromSnippet(item.snippet) // Add location extraction logic here
        }));
        
        setSearchResults(mappedResults);
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
      const { data, error } = await supabase.functions.invoke('get-contact-info', {
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

  const toggleProfileExpansion = (index: number) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProfiles(newExpanded);
  };

  const analyzeCandidate = async (candidate: SearchResult, index: number) => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setLoadingAnalysis(prev => new Set([...prev, index]));
    try {
      const { data, error } = await supabase.functions.invoke('analyze-candidate', {
        body: {
          candidate: {
            name: candidate.title,
            profile: candidate.snippet,
            linkedin_url: candidate.link
          },
          requirements: jobDescription
        }
      });

      if (error) throw error;

      setAnalysisResults(prev => ({ ...prev, [index]: data }));
      toast.success('Candidate analyzed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze candidate');
    } finally {
      setLoadingAnalysis(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const getContactInfo = async (candidate: SearchResult, index: number) => {
    setLoadingContact(prev => new Set([...prev, index]));
    try {
      const contactData = await enrichProfile(candidate.link);
      if (contactData) {
        setContactInfo(prev => ({ ...prev, [index]: contactData }));
        toast.success('Contact information retrieved!');
      } else {
        toast.error('No contact information found');
      }
    } catch (error) {
      console.error('Contact enrichment failed:', error);
      toast.error('Failed to get contact information');
    } finally {
      setLoadingContact(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const saveCandidate = async (candidate: SearchResult, index: number) => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setSavingCandidates(prev => new Set([...prev, index]));
    try {
      // Extract candidate details from search result
      const candidateData = {
        name: candidate.title.split(' - ')[0] || candidate.title, // Extract name from title
        job_title: candidate.title.includes(' - ') ? candidate.title.split(' - ')[1] : '',
        company: candidate.displayLink.includes('linkedin.com') ? '' : candidate.displayLink,
        location: candidate.location || '',
        linkedin_url: candidate.link,
        profile_summary: candidate.snippet,
        status: 'new' as const,
        tags: ['sourced'] as string[],
        enrichment_status: 'pending' as const
      };

      // Save candidate to database
      const { data: savedCandidate, error: candidateError } = await supabase
        .from('saved_candidates')
        .insert([candidateData])
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Add candidate to project if project is selected
      if (savedCandidate && selectedProjectId) {
        const { error: projectError } = await supabase
          .from('project_candidates')
          .insert([{
            project_id: selectedProjectId,
            candidate_id: savedCandidate.id
          }]);

        if (projectError) throw projectError;
      }

      // If we have contact info for this candidate, merge it
      const contactData = contactInfo[index];
      if (contactData && savedCandidate) {
        const updateData: any = {};
        if (contactData.email) updateData.work_email = contactData.email;
        if (contactData.phone) updateData.mobile_phone = contactData.phone;
        if (contactData.personal_emails) updateData.personal_emails = contactData.personal_emails;
        if (contactData.phone_numbers) updateData.phone_numbers = contactData.phone_numbers;

        if (Object.keys(updateData).length > 0) {
          updateData.enrichment_status = 'completed';
          await supabase
            .from('saved_candidates')
            .update(updateData)
            .eq('id', savedCandidate.id);
        }
      }

      setSavedCandidates(prev => new Set([...prev, index]));
      toast.success('Candidate saved successfully!');
      
      // Store search in history with project context
      if (booleanString) {
        await supabase
          .from('search_history')
          .insert([{
            search_query: booleanString,
            boolean_query: booleanString,
            platform: 'linkedin',
            results_count: searchResults.length,
            project_id: selectedProjectId
          }]);
      }

    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('Failed to save candidate');
    } finally {
      setSavingCandidates(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // Context management functions
  const saveContextItem = async (item: Omit<ContextItem, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('context_items')
        .insert([{
          ...item,
          user_id: userId,
          project_id: selectedProjectId
        }])
        .select()
        .single();

      if (error) throw error;

      const newContextItem: ContextItem = {
        ...data,
        isExpanded: false
      };

      setContextItems(prev => [newContextItem, ...prev]);
      return newContextItem;
    } catch (error) {
      console.error('Error saving context item:', error);
      toast.error('Failed to save context item');
      return null;
    }
  };

  const toggleContextExpansion = (id: string) => {
    setContextItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  const removeContextItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('context_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContextItems(prev => prev.filter(item => item.id !== id));
      toast.success('Context item removed');
    } catch (error) {
      console.error('Error removing context item:', error);
      toast.error('Failed to remove context item');
    }
  };

  const loadContextItems = async () => {
    if (!userId) return;
    
    setLoadingContext(true);
    try {
      const { data, error } = await supabase
        .from('context_items')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', selectedProjectId || null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContextItems(data.map(item => ({ ...item, isExpanded: false })));
    } catch (error) {
      console.error('Error loading context items:', error);
    } finally {
      setLoadingContext(false);
    }
  };

  // Load context items when component mounts or project changes
  useEffect(() => {
    loadContextItems();
  }, [userId, selectedProjectId]);

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
              <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Link className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scrape any website URL with Firecrawl AI</p>
                    <p className="text-xs text-gray-500 mt-1">Extract job descriptions, company info, or requirements from web pages</p>
                  </TooltipContent>
                </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scrape Website Content</DialogTitle>
                        <DialogDescription>
                          Enter a URL to scrape its content and add it to your job description. Note: LinkedIn URLs cannot be scraped due to their anti-bot protection.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter website URL (LinkedIn URLs won't work)..."
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
                  <p>Upload and extract content with Gemini AI</p>
                  <p className="text-xs text-gray-500 mt-1">Supports PDFs, Word docs, images, and text files</p>
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
              <Dialog open={showPerplexityDialog} onOpenChange={setShowPerplexityDialog}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <img 
                          src="/assets/perplexity.svg" 
                          alt="Perplexity" 
                          className="w-4 h-4" 
                        />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search the web with Perplexity AI</p>
                    <p className="text-xs text-gray-500 mt-1">Get real-time web search results and current market intelligence</p>
                  </TooltipContent>
                </Tooltip>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Perplexity Web Search</DialogTitle>
                        <DialogDescription>
                          Search the web with Perplexity AI and add results to your job description.
                        </DialogDescription>
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
            </div>
          </div>
          
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste your job description here..."
            className="min-h-[120px] mb-4"
          />

          {/* Context Items Thumbnails */}
          {contextItems.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Added Context ({contextItems.length} item{contextItems.length !== 1 ? 's' : ''})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {contextItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {item.type === 'url_scrape' && <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        {item.type === 'file_upload' && <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        {item.type === 'perplexity_search' && <img src="/assets/perplexity.svg" alt="Perplexity" className="w-4 h-4 flex-shrink-0" />}
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => toggleContextExpansion(item.id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          {item.isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => removeContextItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview text */}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {item.summary || item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '')}
                    </p>
                    
                    {/* Source info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {item.type === 'url_scrape' && item.source_url && (
                          <span title={item.source_url}>{new URL(item.source_url).hostname}</span>
                        )}
                        {item.type === 'file_upload' && item.file_name && (
                          <span>{item.file_name}</span>
                        )}
                        {item.type === 'perplexity_search' && (
                          <span>Web search</span>
                        )}
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Expanded content */}
                    {item.isExpanded && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="max-h-32 overflow-y-auto text-xs text-gray-700 bg-white p-2 rounded border">
                          {item.content}
                        </div>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                          >
                            View original source ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
            <Textarea
              value={booleanString}
              onChange={(event) => setBooleanString(event.target.value)}
              className="font-mono min-h-[120px] resize-y"
              placeholder="Generated Boolean search string will appear here..."
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
            {searchResults.map((result, index) => {
              const isExpanded = expandedProfiles.has(index);
              const analysis = analysisResults[index];
              const contact = contactInfo[index];
              
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {/* Main Card */}
                  <div
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedProfiles.has(index)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => toggleProfileExpansion(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedProfiles.has(index)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleProfileSelection(index);
                            }}
                            className="w-4 h-4"
                          />
                          <h3 className="font-semibold text-blue-600 hover:underline">
                            {result.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                        {result.location && (
                          <p className="text-xs text-purple-600 mt-1 font-medium">
                            📍 {result.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{result.displayLink}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProfileExpansion(index);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? '-' : '+'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => analyzeCandidate(result, index)}
                          disabled={loadingAnalysis.has(index)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          {loadingAnalysis.has(index) ? 'Analyzing...' : 'Analyze vs Requirements'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => getContactInfo(result, index)}
                          disabled={loadingContact.has(index)}
                        >
                          <Search className="w-4 h-4 mr-1" />
                          {loadingContact.has(index) ? 'Getting...' : 'Get Contact Info'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => saveCandidate(result, index)}
                          disabled={savingCandidates.has(index) || savedCandidates.has(index) || !selectedProjectId}
                        >
                          {savedCandidates.has(index) ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              {savingCandidates.has(index) ? 'Saving...' : 'Save to Project'}
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Analysis Results */}
                      {analysis && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-sm mb-2">🎯 Analysis Results</h4>
                          <div className="space-y-2">
                            {analysis.match_score && (
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Match Score:</span>
                                <span className={`text-sm font-bold ${
                                  analysis.match_score >= 80 ? 'text-green-600' :
                                  analysis.match_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>{analysis.match_score}%</span>
                              </div>
                            )}
                            {analysis.strengths && (
                              <div>
                                <span className="text-sm font-medium text-green-600">Strengths:</span>
                                <ul className="text-xs text-gray-600 list-disc list-inside ml-2">
                                  {analysis.strengths.map((strength: string, i: number) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.concerns && (
                              <div>
                                <span className="text-sm font-medium text-red-600">Concerns:</span>
                                <ul className="text-xs text-gray-600 list-disc list-inside ml-2">
                                  {analysis.concerns.map((concern: string, i: number) => (
                                    <li key={i}>{concern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Information */}
                      {contact && (
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-sm mb-2">📞 Contact Information</h4>
                          <div className="space-y-1 text-sm">
                            {contact.email && (
                              <div className="flex justify-between">
                                <span className="font-medium">Email:</span>
                                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex justify-between">
                                <span className="font-medium">Phone:</span>
                                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.linkedin && (
                              <div className="flex justify-between">
                                <span className="font-medium">LinkedIn:</span>
                                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View Profile
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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