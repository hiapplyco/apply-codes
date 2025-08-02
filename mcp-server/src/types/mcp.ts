import { z } from 'zod';

// MCP Tool Schema Definitions
export const MCPToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.any()),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
  }),
});

export const MCPToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()),
});

export const MCPToolResponseSchema = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string(),
  })),
  isError: z.boolean().optional(),
});

// Apply.codes specific schemas
export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  profileUrl: z.string().url().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  source: z.string().optional(),
});

export const JobRequirementsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default('USD'),
  }).optional(),
});

export const SearchCriteriaSchema = z.object({
  keywords: z.string(),
  location: z.string().optional(),
  platforms: z.array(z.enum(['linkedin', 'google_jobs', 'github', 'indeed'])).default(['linkedin']),
  maxResults: z.number().min(1).max(100).default(20),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
});

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['resume', 'cover_letter', 'job_description', 'other']),
  content: z.string(),
  extractedData: z.record(z.any()).optional(),
  metadata: z.object({
    uploadedAt: z.string(),
    size: z.number(),
    mimeType: z.string(),
  }).optional(),
});

export const InterviewPlanSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  position: z.string(),
  interviewType: z.enum(['phone', 'video', 'onsite', 'technical']),
  duration: z.number().min(15).max(480), // minutes
  questions: z.array(z.object({
    category: z.string(),
    question: z.string(),
    expectedAnswer: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })),
  competencies: z.array(z.string()),
  notes: z.string().optional(),
});

export const WorkflowExecutionSchema = z.object({
  workflowId: z.string(),
  input: z.record(z.any()),
  options: z.object({
    async: z.boolean().default(false),
    timeout: z.number().default(300000), // 5 minutes
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
});

// TypeScript types derived from schemas
export type MCPTool = z.infer<typeof MCPToolSchema>;
export type MCPToolCall = z.infer<typeof MCPToolCallSchema>;
export type MCPToolResponse = z.infer<typeof MCPToolResponseSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;
export type SearchCriteria = z.infer<typeof SearchCriteriaSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  authentication?: {
    required: boolean;
    methods: string[];
  };
}

// Session Management
export interface MCPSession {
  id: string;
  userId?: string;
  projectId?: string;
  createdAt: Date;
  lastActivity: Date;
  context: Record<string, any>;
}

// Error Types
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends MCPError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR');
  }
}

export class RateLimitError extends MCPError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR');
  }
}