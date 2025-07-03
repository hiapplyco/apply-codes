
// Compensation analysis data structure
export interface CompensationData {
  salary_range?: {
    min: number;
    max: number;
    currency: string;
    frequency: 'hourly' | 'annually' | 'monthly';
  };
  benefits?: string[];
  location_factor?: number;
  market_data?: {
    percentile_25: number;
    percentile_50: number;
    percentile_75: number;
    percentile_90: number;
  };
  recommendations?: string;
}

// NLP extracted terms
export interface ExtractedTerms {
  skills?: string[];
  technologies?: string[];
  requirements?: string[];
  qualifications?: string[];
  keywords?: string[];
  industry_terms?: string[];
}

// Job enhancement data
export interface JobEnhancementData {
  enhanced_title?: string;
  enhanced_description?: string;
  suggested_improvements?: string[];
  clarity_score?: number;
  completeness_score?: number;
}

// Job summary data
export interface JobSummaryData {
  summary?: string;
  key_responsibilities?: string[];
  required_skills?: string[];
  nice_to_have?: string[];
  company_culture?: string;
  growth_opportunities?: string;
}

// Agent output data union type based on agent type
export type AgentOutputData = 
  | { type: 'extract-nlp-terms'; data: ExtractedTerms }
  | { type: 'analyze-compensation'; data: CompensationData }
  | { type: 'enhance-job-description'; data: JobEnhancementData }
  | { type: 'summarize-job'; data: JobSummaryData }
  | { type: 'custom'; data: Record<string, unknown> };

export type AgentType = 
  | 'extract-nlp-terms'
  | 'analyze-compensation' 
  | 'enhance-job-description'
  | 'summarize-job'
  | 'custom';

export interface AgentOutput {
  id: number;
  job_id: number;
  agent_type: AgentType;
  output_data: AgentOutputData;
  created_at: string;
  updated_at: string;
  key_terms?: string;
  compensation_analysis?: string;
  enhanced_description?: string;
  job_summary?: string;
}

// Generic API error interface
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError | string; // Support both old string errors and new structured errors
  metadata?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

// Specific agent output response
export interface AgentOutputResponse extends ApiResponse<AgentOutput> {}

// Batch agent output response
export interface AgentOutputBatchResponse extends ApiResponse<AgentOutput[]> {}

// Agent processing status
export interface AgentProcessingStatus {
  jobId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep?: string;
  error?: ApiError;
  estimatedCompletion?: string;
}
