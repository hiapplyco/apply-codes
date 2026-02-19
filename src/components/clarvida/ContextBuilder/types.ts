import { ClarvidaJobTemplate } from '@/types/organization';

// Context item type for collected research
export interface ContextItem {
  id: string;
  type: 'file_upload' | 'url_scrape' | 'perplexity_search' | 'manual_input' | 'location_input';
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  file_name?: string;
  file_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Per-item extraction status
export type ItemExtractionStatus = 'pending' | 'extracting' | 'complete' | 'failed';

// Information about an extracted field
export interface ExtractedFieldInfo {
  path: string;
  value: any;
  source: string;        // Context item title
  sourceId: string;      // Context item ID
  confidence: number;
  extractedAt: string;
}

// Per-context-item extraction result
export interface ItemExtractionResult {
  itemId: string;
  status: ItemExtractionStatus;
  fieldsExtracted: number;
  confidence: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// Extraction state for tracking AI-populated fields
export interface ExtractionState {
  isExtracting: boolean;
  lastExtractionSource: string | null;
  extractedFields: Set<string>;
  userOverrides: Set<string>;
  confidence: number;
  fieldsExtracted: number;
  // New: per-item tracking
  itemResults: Map<string, ItemExtractionResult>;
  extractionQueue: string[];  // Item IDs pending extraction
  currentlyExtracting: string | null;  // Item ID being extracted
  // New: field-level source tracking
  fieldSourceMap: Map<string, ExtractedFieldInfo>;
}

// Optimization state for tracking template refinement
export interface OptimizationState {
  isOptimizing: boolean;
  lastOptimizationTime: string | null;
  totalOptimizations: number;
  lastSummary: {
    fields_updated: string[];
    fields_added: string[];
    duplicates_removed: number;
    enhancements_made: string[];
  } | null;
}

// Form field requirements for validation
export interface FormFieldRequirement {
  path: string;
  label: string;
  required: boolean;
  category: 'basic' | 'about' | 'qualifications' | 'other';
}

// Form completeness summary
export interface FormCompleteness {
  requiredFilled: number;
  requiredTotal: number;
  optionalFilled: number;
  optionalTotal: number;
  missingRequired: string[];
  filledFields: string[];
  isReadyToGenerate: boolean;
}

// Image data structure from Gemini image generation
export interface ImageData {
  base64Data: string;
  mimeType: string;
  dataUrl: string;
  storageUrl?: string;
  storagePath?: string;
}

// Generated content structure for non-job-description content types
export interface GeneratedContent {
  type: string;
  content: string;
  metadata?: {
    imageUrl?: string;
    imageData?: ImageData;
    imageStorageUrl?: string;
    imageStoragePath?: string;
    hashtags?: string[];
    subject?: string;
    jobTitle?: string;
    companyName?: string;
    senderName?: string;
    senderEmail?: string;
    recipientName?: string;
    recipientEmail?: string;
  };
}

// Content type from contentcreationbots.json
export interface ContentType {
  content_type: string;
  emoji: string;
  tooltip: string;
  system_prompt: string;
}

// Props for the ContextBuilder component
export interface ContextBuilderProps {
  onJobDescriptionGenerated: (description: string, template: ClarvidaJobTemplate) => void;
  onContentGenerated?: (content: GeneratedContent, contentType: string) => void;
  initialTemplate?: Partial<ClarvidaJobTemplate>;
  initialContextItems?: ContextItem[];
}

// Props for ContextInputSection
export interface ContextInputSectionProps {
  onContextAdded: (item: Omit<ContextItem, 'id' | 'created_at'>) => Promise<void>;
  isExtracting: boolean;
}

// Props for ContextItemsDisplay
export interface ContextItemsDisplayProps {
  items: ContextItem[];
  onRemove: (id: string) => void;
}

// Content type mapping for extraction
export type ExtractionContentType = 'text' | 'file' | 'url' | 'search' | 'location';

// Map ContextItem type to extraction content type
export function mapItemTypeToContentType(type: ContextItem['type']): ExtractionContentType {
  switch (type) {
    case 'file_upload': return 'file';
    case 'url_scrape': return 'url';
    case 'perplexity_search': return 'search';
    case 'location_input': return 'location';
    default: return 'text';
  }
}

// Default empty template
export const DEFAULT_CLARVIDA_TEMPLATE: Partial<ClarvidaJobTemplate> = {
  job_title: '',
  specialty_credential: '',
  location: {
    city: '',
    state: '',
    work_arrangement: 'On-site',
  },
  employment_type: 'Full-time',
  salary: {
    type: 'hourly',
    min: 0,
    max: 0,
  },
  about_role: {
    team_name: '',
    summary: '',
    primary_function: '',
    population_served: '',
  },
  responsibilities: [],
  required_qualifications: {
    education: '',
    licensure: [],
    experience_years: 0,
    technical_skills: [],
    other_requirements: [],
  },
  benefits: {
    daily_pay: false,
    paid_vacation: true,
    sick_leave: true,
    paid_holidays: true,
    medical_dental_vision: true,
    hsa_fsa: true,
    retirement_401k: true,
    licensure_supervision: true,
    ceu_opportunities: true,
    mileage_reimbursement: true,
    cellphone_stipend: true,
    eap: true,
    pet_insurance: false,
    perks_program: true,
  },
  seo_keywords: [],
};
