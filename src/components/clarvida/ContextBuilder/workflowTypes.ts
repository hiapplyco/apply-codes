/**
 * Workflow Types for Job Description Builder + Boolean Generator
 *
 * These types define the data contracts for a single workflow run.
 * All state is scoped to a runId and cleared when starting a new run.
 */

import { ClarvidaJobTemplate } from '@/types/organization';
import { ContextItem } from './types';

/**
 * Structured job context extracted from user inputs
 * This is the authoritative source for job description generation
 */
export interface JobContext {
  // Core identification
  title: string;
  specialty?: string;
  department?: string;

  // Location & Work arrangement
  location: {
    city: string;
    state: string;
    country?: string;
    workArrangement: 'on-site' | 'remote' | 'hybrid';
    travelPercentage?: number;
  };

  // Employment details
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

  // Compensation
  compensation?: {
    type: 'hourly' | 'annual';
    min?: number;
    max?: number;
    currency?: string;
  };

  // Role description
  summary?: string;
  primaryFunction?: string;
  populationServed?: string;
  teamName?: string;

  // Requirements
  responsibilities: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  technicalSkills: string[];

  // Qualifications
  education?: string;
  experienceYears?: number;
  certifications: string[];
  licensure: string[];
  clearanceRequired?: string;

  // Industry context
  industry?: string;
  techStack?: string[];

  // Benefits (optional, can be defaulted)
  benefits?: Partial<ClarvidaJobTemplate['benefits']>;

  // SEO/Search optimization
  keywords: string[];
}

/**
 * Boolean search state with history for re-roll deduplication
 */
export interface BooleanState {
  current: string | null;
  history: BooleanHistoryEntry[];
  isGenerating: boolean;
  lastGeneratedAt: string | null;
  variant: 'strict' | 'balanced' | 'broad';
  explanation?: BooleanExplanation;
  error?: string | null;
}

export interface BooleanHistoryEntry {
  id: string;
  searchString: string;
  variant: 'strict' | 'balanced' | 'broad';
  generatedAt: string;
  isReroll: boolean;
}

export interface BooleanExplanation {
  components: Array<{
    type: 'title' | 'skills' | 'location' | 'exclusion' | 'seniority';
    purpose: string;
    terms: string[];
  }>;
  willInclude: string[];
  willExclude: string[];
  proTips: string[];
}

/**
 * Complete workflow run state
 * Scoped to a single session, cleared on new run
 */
export interface WorkflowRunState {
  // Unique identifier for this workflow run
  runId: string;

  // Timestamps
  startedAt: string;
  completedAt: string | null;

  // Step tracking
  currentStep: 'context' | 'description' | 'boolean' | 'search' | 'complete';

  // Core data
  contextItems: ContextItem[];
  jobContext: JobContext | null;

  // Generated outputs
  generatedDescription: string | null;
  jobTemplate: ClarvidaJobTemplate | null;

  // Boolean search state
  booleanState: BooleanState;

  // Flags
  isDirty: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Payload for generating sophisticated boolean search
 */
export interface GenerateBooleanPayload {
  jobContext: JobContext;
  generatedDescription: string;
  contextItems?: ContextItem[];
  previousGenerations?: string[];
  variant?: 'strict' | 'balanced' | 'broad';
  isReroll?: boolean;
}

/**
 * Response from boolean generation
 */
export interface GenerateBooleanResponse {
  success: boolean;
  searchString?: string;
  explanation?: BooleanExplanation;
  variant?: 'strict' | 'balanced' | 'broad';
  error?: string;
}

/**
 * Create default empty job context
 */
export function createDefaultJobContext(): JobContext {
  return {
    title: '',
    location: {
      city: '',
      state: '',
      workArrangement: 'on-site',
    },
    employmentType: 'full-time',
    responsibilities: [],
    mustHaveSkills: [],
    niceToHaveSkills: [],
    technicalSkills: [],
    certifications: [],
    licensure: [],
    keywords: [],
  };
}

/**
 * Create default boolean state
 */
export function createDefaultBooleanState(): BooleanState {
  return {
    current: null,
    history: [],
    isGenerating: false,
    lastGeneratedAt: null,
    variant: 'balanced',
    error: null,
  };
}

/**
 * Create a new workflow run with fresh state
 */
export function createNewWorkflowRun(): WorkflowRunState {
  return {
    runId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentStep: 'context',
    contextItems: [],
    jobContext: null,
    generatedDescription: null,
    jobTemplate: null,
    booleanState: createDefaultBooleanState(),
    isDirty: false,
    hasUnsavedChanges: false,
  };
}

/**
 * Convert ClarvidaJobTemplate to JobContext for boolean generation
 */
export function templateToJobContext(template: Partial<ClarvidaJobTemplate>): JobContext {
  return {
    title: template.job_title || '',
    specialty: template.specialty_credential,
    location: {
      city: template.location?.city || '',
      state: template.location?.state || '',
      workArrangement: (template.location?.work_arrangement?.toLowerCase() as any) || 'on-site',
    },
    employmentType: (template.employment_type?.toLowerCase().replace('-', '') as any) || 'full-time',
    compensation: template.salary ? {
      type: template.salary.type || 'hourly',
      min: template.salary.min,
      max: template.salary.max,
    } : undefined,
    summary: template.about_role?.summary,
    primaryFunction: template.about_role?.primary_function,
    populationServed: template.about_role?.population_served,
    teamName: template.about_role?.team_name,
    responsibilities: template.responsibilities || [],
    mustHaveSkills: template.required_qualifications?.technical_skills || [],
    niceToHaveSkills: [],
    technicalSkills: template.required_qualifications?.technical_skills || [],
    education: template.required_qualifications?.education,
    experienceYears: template.required_qualifications?.experience_years,
    certifications: [],
    licensure: template.required_qualifications?.licensure || [],
    keywords: template.seo_keywords || [],
    benefits: template.benefits,
  };
}

/**
 * Validate that job context has minimum required fields for boolean generation
 */
export function validateJobContextForBoolean(context: JobContext): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.title?.trim()) {
    errors.push('Job title is required');
  }

  if (!context.location?.city?.trim() && context.location?.workArrangement !== 'remote') {
    errors.push('Location is required for non-remote positions');
  }

  if (context.mustHaveSkills.length === 0 && context.technicalSkills.length === 0) {
    // Not an error, but we can still generate without skills
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
