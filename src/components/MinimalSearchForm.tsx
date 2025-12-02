import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CompactCandidateAnalysis } from '@/components/search/CompactCandidateAnalysis';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PerplexityResult } from '@/components/perplexity/PerplexityResult';
import { FirecrawlResult } from '@/components/firecrawl/FirecrawlResult';
import { Search, Sparkles, Copy, ExternalLink, Globe, Upload, Zap, Plus, Link, Save, CheckCircle, Eye, EyeOff, X, FileText, Trash2, Lightbulb, MapPin, Grid3X3, List, Loader2, Mail, ArrowDown, AlertCircle } from 'lucide-react';
import { ContainedLoading, ButtonLoading, InlineLoading } from '@/components/ui/contained-loading';
import { toast } from 'sonner';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { DocumentProcessor } from '@/lib/modernPdfProcessor';
import BooleanExplainer from '@/components/BooleanExplainer';
import { functionBridge } from '@/lib/function-bridge';
import { BooleanExplanation } from '@/types/boolean-explanation';
import LocationModal from '@/components/LocationModal';
import ProjectLocationService from '@/services/ProjectLocationService';
import { useProjectContext } from '@/context/ProjectContext';
import { BooleanGenerationAnimation } from '@/components/search/BooleanGenerationAnimation';
import { trackBooleanGeneration, trackCandidateSearch, trackEvent } from '@/lib/analytics';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  created_at?: string | Date | { toDate?: () => Date; seconds?: number; nanoseconds?: number };
  project_id?: string | null;
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
  // Debug version to help with cache issues
  console.log('MinimalSearchForm v3.1 loaded', { userId, selectedProjectId });

  // Get project context
  const { selectedProject } = useProjectContext();
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [booleanString, setBooleanString] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid view
  const [showAIAnalysis, setShowAIAnalysis] = useState(false); // Make AI analysis optional
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBooleanAnimation, setShowBooleanAnimation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());
  const [expandedProfiles, setExpandedProfiles] = useState<Set<number>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<{ [key: number]: any }>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<number>>(new Set());
  const [contactInfo, setContactInfo] = useState<{ [key: number]: ContactInfo }>({});
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
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailContext, setEmailContext] = useState('');
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collapse states for progressive focus
  const [requirementsCollapsed, setRequirementsCollapsed] = useState(false);
  const [booleanCollapsed, setBooleanCollapsed] = useState(false);

  // Boolean explanation states
  const [showExplanation, setShowExplanation] = useState(false);
  const [booleanExplanation, setBooleanExplanation] = useState<BooleanExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationCollapsed, setExplanationCollapsed] = useState(false);

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

      const inserted = Array.isArray(insertResult.data) ? insertResult.data[0] : insertResult.data;

      const newContextItem: ContextItem = {
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
      toast.error('Failed to save context item');
      return null;
    }
  }, [userId, selectedProject, selectedProjectId]);

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

      // TODO: Add location to project using the new service once migration is applied
      // const projectLocation = await ProjectLocationService.addLocationToProject({
      //   project_id: selectedProject.id,
      //   formatted_address: location.formatted_address,
      //   place_id: location.place_id,
      //   geometry: location.geometry,
      //   address_components: location.address_components,
      //   notes: `Added for targeted sourcing on ${new Date().toLocaleDateString()}`
      // });

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
        userId,
        maxRetries: 4, // Much faster failure for better UX
        pollInterval: 3000, // Reasonable polling interval
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
        console.error('Supabase function error:', error);
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

  const generateBooleanSearch = async () => {
    // Require either custom instructions OR context items
    if (!jobDescription.trim() && contextItems.length === 0) {
      toast.error('Please add context items or enter custom instructions to generate a boolean search');
      return;
    }

    setIsGenerating(true);
    setShowBooleanAnimation(true);
    try {
      // Prepare context items for the edge function
      const contextData = contextItems.map(item => ({
        type: item.type,
        title: item.title,
        content: item.content,
        summary: item.summary,
        source_url: item.source_url,
        file_name: item.file_name,
        metadata: item.metadata
      }));

      // Enhanced location data logging
      const locationItems = contextItems.filter(item =>
        item.type === 'manual_input' && item.title?.includes('Location:')
      );

      console.log('🎯 LOCATION DATA FLOW TRACE:');
      console.log('1. Total context items:', contextItems.length);
      console.log('2. Location items found:', locationItems.length);
      console.log('3. Location items details:', locationItems.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content?.substring(0, 100),
        hasMetadata: !!item.metadata,
        metadata: item.metadata
      })));
      console.log('4. Context data being sent to edge function:', contextData.map(item => ({
        type: item.type,
        title: item.title,
        hasMetadata: !!item.metadata,
        metadata: item.metadata
      })));

      // Extract location context from context items
      const locationContext = contextItems
        .filter(item =>
          item.type === 'location_input' ||
          (item.type === 'manual_input' && item.metadata?.isLocationContext) ||
          (item.type === 'manual_input' && item.title?.includes('Location:'))
        )
        .map(item => item.metadata?.formatted_address || item.content)
        .filter(Boolean);

      // Prepare project context
      const projectContext = selectedProject ? {
        id: selectedProject.id,
        name: selectedProject.name,
        description: selectedProject.description,
        created_at: selectedProject.created_at
      } : null;

      console.log('Generating boolean search with FULL CONTEXT:', {
        hasCustomInstructions: !!jobDescription.trim(),
        hasJobTitle: !!jobTitle.trim(),
        hasProjectContext: !!projectContext,
        projectName: projectContext?.name,
        contextItemsCount: contextItems.length,
        locationItemsCount: locationItems.length,
        locationContext: locationContext,
        contextTypes: contextItems.map(item => item.type),
        customInstructionsLength: jobDescription.length
      });

      // Use function bridge to support both Firebase and Supabase
      // Only send description if it has content (don't send empty string)
      const payload: any = {
        contextItems: contextData,
        jobTitle: jobTitle.trim() || undefined,
        projectContext: projectContext,
        userId: userId || undefined
      };

      // Only add description if it's not empty
      if (jobDescription.trim()) {
        payload.description = jobDescription.trim();
      }

      console.log('📤 Payload being sent to generateBooleanSearch:', {
        hasDescription: !!payload.description,
        descriptionLength: payload.description?.length || 0,
        contextItemsCount: payload.contextItems?.length || 0,
        hasJobTitle: !!payload.jobTitle,
        hasProjectContext: !!payload.projectContext
      });

      const result = await functionBridge.generateBooleanSearch(payload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate boolean search');
      }

      if (result.searchString) {
        setBooleanString(result.searchString);

        // Collapse Requirements container to focus on Boolean section
        setRequirementsCollapsed(true);

        // Enhanced success message based on what was used
        if (jobDescription.trim() && contextItems.length > 0) {
          toast.success(`Boolean search generated from custom instructions + ${contextItems.length} context item(s)!`);
        } else if (contextItems.length > 0) {
          toast.success(`Boolean search generated from ${contextItems.length} context item(s)!`);
        } else {
          toast.success('Boolean search generated from custom instructions!');
        }

        // Track successful boolean generation
        trackBooleanGeneration(jobDescription, true);
      } else {
        throw new Error('No search string generated');
      }
    } catch (error) {
      console.error('Error generating boolean search:', error);
      toast.error('Failed to generate boolean search');
      trackBooleanGeneration(jobDescription, false);
    } finally {
      setIsGenerating(false);
      setShowBooleanAnimation(false);
    }
  };

  const handleExplainBoolean = async () => {
    if (!booleanString.trim()) {
      toast.error('Please generate a boolean search string first');
      return;
    }

    setIsExplaining(true);
    try {
      const data = await functionBridge.explainBoolean({
        booleanString: booleanString,
        requirements: jobDescription.trim() || 'Boolean search explanation'
      });
      const error = null;

      if (error) throw error;

      if (data) {
        // Parse the response if it's a string
        const explanation = typeof data === 'string' ? JSON.parse(data) : data;
        setBooleanExplanation(explanation);
        setExplanationCollapsed(false); // Expand the explanation section
        toast.success('Boolean search explained!');
      } else {
        throw new Error('No explanation generated');
      }
    } catch (error) {
      console.error('Error explaining boolean search:', error);
      toast.error('Failed to explain boolean search');
    } finally {
      setIsExplaining(false);
    }
  };

  const searchGoogle = async (page = 1) => {
    if (!booleanString.trim()) {
      toast.error('Please generate or enter a boolean search string');
      return;
    }

    if (page === 1) {
      setIsSearching(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Get the API key from Supabase edge function (same as original implementation)
      const keyData = await functionBridge.getGoogleCseKey();

      if (!keyData?.secret || !keyData.engineId) {
        throw new Error('Failed to get API key');
      }

      const searchQuery = `${booleanString} site:linkedin.com/in/`;
      const cseId = keyData.engineId;

      // Google CSE pagination: start parameter is 1-indexed
      // Page 1 = start 1, Page 2 = start 11, Page 3 = start 21, etc.
      const startIndex = (page - 1) * 10 + 1;

      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${keyData.secret}&cx=${cseId}&q=${encodeURIComponent(searchQuery)}&start=${startIndex}&num=10`
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      // Get total results (capped at 100 by Google CSE)
      const total = Math.min(Number(data.searchInformation?.totalResults || 0), 100);
      setTotalSearchResults(total);
      setSearchPage(page);

      if (data.items) {
        // Map Google search results to SearchResult objects with location extraction
        const mappedResults: SearchResult[] = data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
          htmlTitle: item.htmlTitle,
          location: extractLocationFromSnippet(item.snippet)
        }));

        if (page === 1) {
          setSearchResults(mappedResults);
          // Collapse Boolean container to focus on Search Results
          setBooleanCollapsed(true);
          toast.success(`Found ${total} results`);
        } else {
          setSearchResults(prev => [...prev, ...mappedResults]);
          toast.success(`Loaded ${mappedResults.length} more results`);
        }

        // Track successful search
        trackCandidateSearch('google_cse', mappedResults.length, {
          hasLocation: selectedLocation ? 'yes' : 'no',
          booleanLength: booleanString.length.toString()
        });
      } else {
        if (page === 1) {
          setSearchResults([]);
          toast.info('No results found');
        }
        trackCandidateSearch('google_cse', 0, {
          hasLocation: selectedLocation ? 'yes' : 'no',
          booleanLength: booleanString.length.toString()
        });
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreResults = () => {
    // Google CSE allows max 100 results (10 pages of 10)
    if (searchResults.length < totalSearchResults && searchPage < 10) {
      searchGoogle(searchPage + 1);
    }
  };

  const enrichProfile = async (profileUrl: string): Promise<ContactInfo | null> => {
    try {
      const data = await functionBridge.getContactInfo({ linkedin_url: profileUrl });
      const error = null;

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
      const data = await functionBridge.analyzeCandidate({
        candidate: {
          name: candidate.title,
          profile: candidate.snippet,
          linkedin_url: candidate.link
        },
        requirements: jobDescription
      });
      const error = null;

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
        // Track successful enrichment
        trackProfileEnrichment(candidate.link, true);
        trackEvent('Profile Enrichment', {
          source: 'search_results',
          hasEmail: contactData.email ? 1 : 0,
          hasPhone: contactData.phone ? 1 : 0
        });
      } else {
        toast.error('No contact information found');
        trackProfileEnrichment(candidate.link, false);
      }
    } catch (error) {
      console.error('Contact enrichment failed:', error);
      toast.error('Failed to get contact information');
      trackProfileEnrichment(candidate.link, false);
    } finally {
      setLoadingContact(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const saveCandidate = async (candidate: SearchResult, index: number) => {
    console.log('Saving candidate:', { candidate, selectedProjectId, index });

    if (!selectedProjectId) {
      console.error('No project selected for saving candidate');
      toast.error('Please select a project first');
      return;
    }

    setSavingCandidates(prev => new Set([...prev, index]));
    try {
      // Extract candidate details from search result
      const candidateData = {
        user_id: userId, // Add the user_id field that might be missing
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

      console.log('Candidate data to save:', candidateData);

      // Save candidate to database
      const insertCandidate = await firestoreClient
        .from('saved_candidates')
        .insert({
          ...candidateData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertCandidate.error) {
        console.error('Error saving candidate:', insertCandidate.error);
        throw insertCandidate.error;
      }

      const savedCandidate = Array.isArray(insertCandidate.data)
        ? insertCandidate.data[0]
        : insertCandidate.data;

      console.log('Candidate save result:', savedCandidate);

      // Add candidate to project if project is selected
      if (savedCandidate && selectedProjectId) {
        console.log('Adding candidate to project:', {
          candidateId: savedCandidate.id,
          projectId: selectedProjectId
        });

        const projectAssociation = await firestoreClient
          .from('project_candidates')
          .insert({
            project_id: selectedProjectId,
            candidate_id: savedCandidate.id,
            created_at: new Date().toISOString()
          });

        if (projectAssociation.error) {
          console.error('Error adding candidate to project:', projectAssociation.error);
          throw projectAssociation.error;
        }
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
          await firestoreClient
            .from('saved_candidates')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', savedCandidate.id);
        }
      }

      setSavedCandidates(prev => new Set([...prev, index]));
      toast.success('Candidate saved successfully!');

      // Store search in history with project context
      if (booleanString) {
        await firestoreClient
          .from('search_history')
          .insert({
            search_query: booleanString,
            boolean_query: booleanString,
            platform: 'linkedin',
            results_count: searchResults.length,
            project_id: selectedProjectId,
            created_at: new Date().toISOString()
          });
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
      toast.error('Failed to remove context item');
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
      toast.error('Failed to clear all context items', { id: 'clear-all' });
    }
  };

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

  // Load context items when component mounts or project changes
  useEffect(() => {
    loadContextItems();
  }, [userId, selectedProjectId, selectedProject?.id, loadContextItems]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const generateEmailTemplates = async () => {
    const selectedResults = searchResults.filter((_, index) => selectedProfiles.has(index));

    if (selectedResults.length === 0) {
      toast.error('Please select some profiles first');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setIsGeneratingEmails(true);
    try {
      // Prepare candidates data for the edge function
      const candidates = selectedResults.map(result => ({
        name: result.title.split(' - ')[0] || result.title,
        profileUrl: result.link,
        snippet: result.snippet,
        location: result.location
      }));

      const response = await functionBridge.generateEmailTemplates({
        candidates,
        jobDescription,
        context: emailContext.trim() || undefined
      });

      if (response?.success && response?.emailTemplates) {
        setGeneratedEmails(response.emailTemplates);
        toast.success(`Generated ${response.emailTemplates.length} email template(s)!`);
      } else {
        throw new Error('No email templates generated');
      }
    } catch (error) {
      console.error('Error generating email templates:', error);
      toast.error('Failed to generate email templates');
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  const openEmailDialog = () => {
    const selectedResults = searchResults.filter((_, index) => selectedProfiles.has(index));
    if (selectedResults.length === 0) {
      toast.error('Please select some profiles first');
      return;
    }
    setShowEmailDialog(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-5xl mx-auto p-4">
        {/* Hero Section with Better Visual Hierarchy */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Boolean Search Generator</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-3xl leading-relaxed">
            Generate intelligent boolean search strings and find qualified candidates with Google Search + Nymeria enrichment
          </p>
        </div>

        {/* Step 1: Custom Instructions & Context */}
        <Collapsible open={!requirementsCollapsed} onOpenChange={(open) => setRequirementsCollapsed(!open)}>
          <Card className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CollapsibleTrigger asChild>
              <div className="p-6 cursor-pointer group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-700 rounded-full font-bold text-lg">
                      1
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                        Custom Instructions & Context
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Add requirements and context to improve search accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                    {requirementsCollapsed ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {/* URL Scraper Button */}
                  <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 h-10 px-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                          >
                            <Link className="w-4 h-4" />
                            <span className="text-sm font-medium">Scrape</span>
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
                            <ButtonLoading
                              isLoading={isScrapingUrl}
                              loadingText="Scraping..."
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Scrape & Add
                            </ButtonLoading>
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
                        variant="outline"
                        className="flex items-center gap-2 h-10 px-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                      >
                        <ButtonLoading isLoading={isUploadingFile}>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload</span>
                        </ButtonLoading>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload and extract content with Gemini AI</p>
                      <p className="text-xs text-gray-500 mt-1">Best with PDFs and text files. DOCX processing temporarily limited.</p>
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
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 h-10 px-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                          >
                            <img
                              src="/assets/perplexity.svg"
                              alt="Perplexity"
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">Search</span>
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
                            <ButtonLoading
                              isLoading={isSearchingPerplexity}
                              loadingText="Searching..."
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Search & Add
                            </ButtonLoading>
                          </Button>
                          <Button variant="outline" onClick={() => setShowPerplexityDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Location Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 h-10 px-4 hover:bg-purple-50 hover:border-purple-300 transition-all"
                        onClick={() => setShowLocationDialog(true)}
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Location</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add location context with Google Places</p>
                      <p className="text-xs text-gray-500 mt-1">Set geographic preferences for targeted boolean search generation</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Job Title Input */}
                <div className="space-y-2">
                  <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">
                    Job Title <span className="text-gray-400 text-xs">(optional but recommended)</span>
                  </label>
                  <input
                    id="job-title"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist..."
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    Providing a job title helps generate more accurate boolean search strings
                  </p>
                </div>

                <Textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Enter custom instructions or requirements (optional)...

This area is for your specific search instructions, filtering criteria, or additional requirements. The embedded context items below will automatically be included when generating the boolean search."
                  className="min-h-[120px] mb-4"
                />

                {/* Context Items */}
                {contextItems.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Added Context ({contextItems.length} item{contextItems.length !== 1 ? 's' : ''})
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllContextItems}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                      {contextItems.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 group ${(item.type === 'perplexity' || item.type === 'perplexity_search')
                            ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-white'
                            : 'border-gray-200'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {item.type === 'url_scrape' && <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                              {item.type === 'file_upload' && <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              {(item.type === 'perplexity' || item.type === 'perplexity_search') && (
                                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              )}
                              {item.type === 'manual_input' && (
                                item.title?.includes('Location:') ?
                                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" /> :
                                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                              <span className={`text-xs font-medium truncate ${(item.type === 'perplexity' || item.type === 'perplexity_search')
                                ? 'text-purple-900'
                                : 'text-gray-800'
                                }`}>
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
                            {(() => {
                              const previewText = item.summary || item.content;
                              // Strip markdown for Perplexity items
                              if (item.type === 'perplexity' || item.type === 'perplexity_search') {
                                const stripped = previewText
                                  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
                                  .replace(/[#*_`~]/g, '') // Remove markdown formatting
                                  .replace(/\n+/g, ' ') // Replace newlines with spaces
                                  .trim();
                                return stripped.substring(0, 150) + (stripped.length > 150 ? '...' : '');
                              }
                              return previewText.substring(0, 100) + (previewText.length > 100 ? '...' : '');
                            })()}
                          </p>

                          {/* Source info */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {item.type === 'url_scrape' && item.source_url && (() => {
                                try {
                                  const url = item.source_url.startsWith('http') ? item.source_url : `https://${item.source_url}`;
                                  return <span title={item.source_url}>{new URL(url).hostname}</span>;
                                } catch (e) {
                                  // Fallback: extract hostname manually
                                  const hostname = item.source_url.replace(/^https?:\/\//, '').split('/')[0];
                                  return <span title={item.source_url}>{hostname}</span>;
                                }
                              })()}
                              {item.type === 'file_upload' && item.file_name && (
                                <span>{item.file_name}</span>
                              )}
                              {(item.type === 'perplexity' || item.type === 'perplexity_search') && (
                                <span>Web search</span>
                              )}
                            </span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Expanded content */}
                          {item.isExpanded && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              {(item.type === 'perplexity' || item.type === 'perplexity_search') ? (
                                <div className="max-h-96 overflow-y-auto">
                                  <PerplexityResult
                                    content={item.content}
                                    citations={item.metadata?.citations}
                                    query={item.metadata?.query || item.title}
                                    compact={false}
                                    className="text-xs"
                                  />
                                </div>
                              ) : item.type === 'url_scrape' ? (
                                <div className="max-h-96 overflow-y-auto">
                                  <FirecrawlResult
                                    content={item.content}
                                    sourceUrl={item.source_url}
                                    compact={false}
                                    className="text-xs"
                                  />
                                </div>
                              ) : (
                                <>
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
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                  <Button
                    onClick={generateBooleanSearch}
                    disabled={(!jobDescription.trim() && contextItems.length === 0) || isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5"
                  >
                    <ButtonLoading
                      isLoading={isGenerating && !showBooleanAnimation}
                      loadingText="Generating..."
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Boolean Search
                    </ButtonLoading>
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Step 2: Boolean Search String */}
        {booleanString && (
          <Collapsible open={!booleanCollapsed} onOpenChange={(open) => setBooleanCollapsed(!open)}>
            <Card className="border-2 border-purple-300 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CollapsibleTrigger asChild>
                <div className="p-6 cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold text-lg shadow-md">
                        2
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                          Boolean Search String
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Edit and refine your generated search query</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-600 transition-colors">
                      {booleanCollapsed ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 pt-2 border-t border-purple-100">
                  <div className="space-y-4">
                    <Textarea
                      value={booleanString}
                      onChange={(event) => setBooleanString(event.target.value)}
                      className="font-mono min-h-[120px] resize-y"
                      placeholder="Generated Boolean search string will appear here..."
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => copyToClipboard(booleanString)}
                          variant="outline"
                          className="hover:bg-purple-50 hover:border-purple-300 transition-all"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={handleExplainBoolean}
                          variant="outline"
                          disabled={isExplaining || !booleanString.trim()}
                          className="hover:bg-purple-50 hover:border-purple-300 transition-all"
                        >
                          <ButtonLoading
                            isLoading={isExplaining}
                            loadingText="Analyzing..."
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Explain This Search</span>
                            <span className="sm:hidden">Explain</span>
                          </ButtonLoading>
                        </Button>
                      </div>
                      <Button
                        onClick={() => searchGoogle()}
                        disabled={isSearching}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 sm:ml-auto"
                      >
                        <ButtonLoading
                          isLoading={isSearching}
                          loadingText="Searching..."
                        >
                          <Search className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Search LinkedIn Profiles</span>
                          <span className="sm:hidden">Search LinkedIn</span>
                        </ButtonLoading>
                      </Button>
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
            <Card className="border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CollapsibleTrigger asChild>
                <div className="p-6 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-indigo-900">Boolean Search Explanation</h2>
                      <p className="text-sm text-indigo-600">Understanding your search strategy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExplanation(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition-colors"
                      title="View in full screen"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBooleanExplanation(null);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 transition-colors"
                      title="Remove explanation"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="transition-transform duration-200">
                      {explanationCollapsed ? (
                        <Eye className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-500 ease-in-out">
                <div className="mt-2">
                  <BooleanExplainer explanation={booleanExplanation} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Search Results */}
        {(searchResults.length > 0 || isSearching) && (
          <ContainedLoading
            isLoading={isSearching}
            loadingText="Searching LinkedIn profiles..."
            className="mb-6"
          >
            <Card className="border-2 border-green-300 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-blue-50">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold text-lg shadow-md">
                      3
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Search Results ({searchResults.length})
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">Select profiles to enrich and save</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* AI Analysis Button - Moved to top */}
                    {!showAIAnalysis && (
                      <Button
                        onClick={() => setShowAIAnalysis(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze with AI ({searchResults.length})
                      </Button>
                    )}

                    {/* View Mode Toggle */}
                    <div className="flex items-center border rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-7 px-2"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-7 px-2"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>

                    <Badge variant="outline">{selectedProfiles.size} selected</Badge>
                    <Button
                      onClick={openEmailDialog}
                      disabled={selectedProfiles.size === 0}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Generate Email Templates
                    </Button>
                  </div>
                </div>

                <div
                  ref={resultsContainerRef}
                  className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}
                  style={{ maxHeight: viewMode === 'grid' ? '800px' : 'none', overflowY: viewMode === 'grid' ? 'auto' : 'visible' }}
                >
                  {searchResults.map((result, index) => {
                    const isExpanded = expandedProfiles.has(index);
                    const analysis = analysisResults[index];
                    const contact = contactInfo[index];
                    const isSelected = selectedProfiles.has(index);

                    return (
                      <div
                        key={index}
                        className={`
                          group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl
                          ${isSelected ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/30' : 'border-gray-200 hover:border-purple-200'}
                          ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 p-6' : 'flex flex-col p-5 h-full'}
                        `}
                      >
                        {/* Selection Checkbox - Absolute positioning for grid */}
                        <div className="absolute top-4 right-4 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleProfileSelection(index);
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer transition-all"
                          />
                        </div>

                        {/* Main Content Area */}
                        <div className={`flex-1 ${viewMode === 'list' ? 'min-w-0' : 'flex flex-col'}`}>
                          {/* Header: Title & Role */}
                          <div className="mb-3 pr-8">
                            <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-purple-700 transition-colors">
                              <a
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline decoration-2 decoration-purple-200"
                              >
                                {result.title.split(' | ')[0] || result.title.split(' - ')[0] || result.title}
                              </a>
                            </h3>
                            {(result.title.includes(' | ') || result.title.includes(' - ')) && (
                              <p className="text-sm font-medium text-purple-600 mt-1">
                                {result.title.split(' | ')[1] || result.title.split(' - ')[1]}
                              </p>
                            )}
                          </div>

                          {/* Location & Source */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                            {result.location && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                <MapPin className="w-3 h-3" />
                                {result.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {new URL(result.link).hostname.replace('www.', '')}
                            </span>
                          </div>

                          {/* Snippet */}
                          <p className={`text-sm text-gray-600 leading-relaxed mb-4 ${viewMode === 'grid' ? 'line-clamp-4 flex-1' : ''}`}>
                            {result.snippet}
                          </p>

                          {/* Skills Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {result.snippet.match(/\b(Python|JavaScript|React|Node|AWS|GCP|Azure|SQL|Docker|Kubernetes|Java|C\+\+|TypeScript|Machine Learning|AI|Data Science|Full Stack|Backend|Frontend|DevOps)\b/gi)?.slice(0, viewMode === 'grid' ? 4 : 8).map((skill, skillIndex) => (
                              <Badge
                                key={skillIndex}
                                variant="secondary"
                                className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 font-medium"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          {/* Action Bar */}
                          <div className={`
                            flex flex-wrap gap-2 pt-4 border-t border-gray-100 mt-auto
                            ${viewMode === 'list' ? 'justify-start' : 'justify-between'}
                          `}>
                            {/* Analyze Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => analyzeCandidate(result, index)}
                              disabled={loadingAnalysis.has(index)}
                              className="h-8 text-xs font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                            >
                              {loadingAnalysis.has(index) ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Analyze
                            </Button>

                            {/* Email Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Select this profile specifically for email generation
                                if (!selectedProfiles.has(index)) {
                                  toggleProfileSelection(index);
                                }
                                setTimeout(() => openEmailDialog(), 0);
                              }}
                              className="h-8 text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Mail className="w-3.5 h-3.5 mr-1.5" />
                              Email
                            </Button>

                            {/* Add to Global Project Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveCandidate(result, index)}
                              disabled={savingCandidates.has(index) || savedCandidates.has(index)}
                              className={`h-8 text-xs font-medium ${savedCandidates.has(index)
                                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                              {savingCandidates.has(index) ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : savedCandidates.has(index) ? (
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              {savedCandidates.has(index) ? 'Saved' : 'Add to Project'}
                            </Button>
                          </div>
                        </div>

                        {/* Analysis Results Overlay/Section */}
                        {analysis && (
                          <div className={`
                            bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4
                            ${viewMode === 'list' ? 'w-80 flex-shrink-0' : 'mt-4'}
                          `}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-sm text-purple-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                AI Analysis
                              </h4>
                              {analysis.match_score && (
                                <Badge className={`
                                  ${analysis.match_score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                                    analysis.match_score >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                      'bg-red-100 text-red-700 border-red-200'}
                                `}>
                                  {analysis.match_score}% Match
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-3">
                              {analysis.strengths && analysis.strengths.length > 0 && (
                                <div>
                                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Strengths</span>
                                  <ul className="mt-1 space-y-1">
                                    {analysis.strengths.slice(0, 2).map((strength: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {analysis.concerns && analysis.concerns.length > 0 && (
                                <div>
                                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Concerns</span>
                                  <ul className="mt-1 space-y-1">
                                    {analysis.concerns.slice(0, 1).map((concern: string, i: number) => (
                                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                        <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{concern}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Load More Results */}
                  {searchResults.length < totalSearchResults && searchPage < 10 && (
                    <div className="col-span-full flex flex-col items-center gap-2 py-6">
                      <p className="text-sm text-gray-500">
                        Showing {searchResults.length} of {totalSearchResults} results
                      </p>
                      <Button
                        variant="outline"
                        onClick={loadMoreResults}
                        disabled={isLoadingMore}
                        className="border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-4 h-4 mr-2" />
                            Load 10 More Results
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

              </div >
            </Card >
          </ContainedLoading >
        )}

        {
          searchResults.length === 0 && booleanString && (
            <Card className="p-6 border-2 border-gray-300">
              <p className="text-center text-gray-500">
                Click "Search LinkedIn Profiles" to find candidates
              </p>
            </Card>
          )
        }

        {/* AI Analysis Button - Moved to search results header */}

        {/* Candidate Analysis Section */}
        {
          searchResults.length > 0 && showAIAnalysis && (
            <div className="mt-6">
              <CompactCandidateAnalysis
                candidates={searchResults}
                jobDescription={jobDescription}
                onCandidateSelect={(candidate) => {
                  const index = searchResults.findIndex(r => r.link === candidate.link);
                  if (index !== -1) {
                    toggleProfileExpansion(index);
                  }
                }}
              />
            </div>
          )
        }

        {/* Email Generation Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Email Templates</DialogTitle>
              <DialogDescription>
                Add context about the role, company culture, or specific requirements to personalize the email templates for the selected candidates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional Context (Optional)
                </label>
                <Textarea
                  placeholder="e.g., We're a fast-growing startup looking for someone passionate about AI/ML to join our core team. Competitive salary, equity, and remote-friendly culture..."
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={generateEmailTemplates}
                  disabled={isGeneratingEmails}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingEmails ? 'Generating...' : 'Generate Email Templates'}
                </Button>
                <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generated Email Templates */}
        {
          generatedEmails.length > 0 && (
            <Card className="p-6 border-2 border-blue-400">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">4. Generated Email Templates ({generatedEmails.length})</h2>
                <Button
                  onClick={() => setGeneratedEmails([])}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {generatedEmails.map((email, index) => (
                  <div key={index} className="border rounded-lg bg-white">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">📧 {email.candidateName}</h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(email.subject)}
                          >
                            Copy Subject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(email.body)}
                          >
                            Copy Email
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Subject:</div>
                        <div className="text-sm font-medium text-purple-600 bg-purple-50 p-2 rounded border">
                          {email.subject}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Email Body:</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {email.body}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <a
                          href={email.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View LinkedIn Profile
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        }

        {/* Location Modal */}
        <LocationModal
          isOpen={showLocationDialog}
          onClose={() => setShowLocationDialog(false)}
          onLocationSelect={handleLocationSelect}
        />

        {/* Boolean Explanation Dialog */}
        <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Boolean Search Explanation</DialogTitle>
              <DialogDescription>
                Understanding what your search will find and why
              </DialogDescription>
            </DialogHeader>
            {booleanExplanation && (
              <BooleanExplainer
                explanation={booleanExplanation}
                onClose={() => setShowExplanation(false)}
                variant="modal"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Boolean Generation Animation */}
        <BooleanGenerationAnimation
          isOpen={showBooleanAnimation}
          onComplete={() => setShowBooleanAnimation(false)}
          estimatedTimeMs={120000}
        />
      </div >
    </TooltipProvider >
  );
}
