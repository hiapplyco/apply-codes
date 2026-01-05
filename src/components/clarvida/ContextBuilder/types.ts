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

// Extraction state for tracking AI-populated fields
export interface ExtractionState {
  isExtracting: boolean;
  lastExtractionSource: string | null;
  extractedFields: Set<string>;
  userOverrides: Set<string>;
  confidence: number;
  fieldsExtracted: number;
}

// Props for the ContextBuilder component
export interface ContextBuilderProps {
  onJobDescriptionGenerated: (description: string, template: ClarvidaJobTemplate) => void;
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
