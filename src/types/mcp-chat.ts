import type { LinkedInCandidate } from '@/components/chat/LinkedInCandidateCard';

export type MCPStreamEventType =
  | 'session'
  | 'thinking'
  | 'tool_call'
  | 'tool_progress'
  | 'tool_result'
  | 'token'
  | 'error'
  | 'done'
  | 'pending_confirmation';

export type MCPToolResultStatus = 'complete' | 'error' | 'awaiting_confirmation';

export interface PendingConfirmation {
  confirmationId: string;
  tool: string;
  args: Record<string, unknown>;
  description: string;
}

export type MCPChatEvent =
  | { type: 'session'; session_id: string; model: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; tool: { name: string; args: Record<string, unknown> }; requiresConfirmation?: boolean }
  | { type: 'tool_progress'; tool: string; message: string; progress?: number }
  | { type: 'tool_result'; tool: string; result: unknown; status: MCPToolResultStatus }
  | { type: 'token'; content: string }
  | { type: 'error'; message: string; code?: string }
  | { type: 'done'; toolCalls?: number; pendingConfirmation?: PendingConfirmation };

export interface MCPToolResultEntry {
  tool: string;
  result: unknown;
  status: MCPToolResultStatus;
}

export interface BooleanSearchResult {
  booleanGeneration: {
    query: string;
    breakdown: {
      generatedWith: string;
      customInstructions: string;
      location?: string;
    };
    platform: string;
    tips: string[];
  };
  searchResults: {
    candidates: LinkedInCandidate[];
    metadata: {
      totalFound: number;
      platforms: string[];
      location: string;
      customInstructions: string;
      searchTime: string;
      realSearch: boolean;
    };
  };
  summary: {
    stepsExecuted: string[];
    success: boolean;
    candidatesFound: number;
    topMatchScore: number;
  };
}

export interface InterviewGuideResult {
  metadata: {
    jobRole: string;
    experienceLevel: string;
    interviewType: string;
    duration: string;
    company: string;
    generatedAt: string;
  };
  structure: Record<string, string>;
  questions: Array<{
    category: string;
    question: string;
    followUps: string[];
    difficulty?: string;
    purpose?: string;
    timeAllocation?: string;
    panelMember?: string;
  }>;
  evaluationCriteria: Record<string, string>;
  tips: string[];
  nextSteps: string[];
}

export interface InterviewFeedbackResult {
  candidate: { name: string; role: string; interviewDate: string };
  summary: {
    totalInterviews: number;
    averageRating: number;
    consensusLevel: { percentage: number; level: string };
    recommendationDistribution: Record<string, number>;
  };
  analysis: {
    strengthsConsensus: Array<{ theme: string; frequency: number; examples: string[] }>;
    concernsConsensus: Array<{ theme: string; frequency: number; examples: string[] }>;
    interviewerAlignment: { alignment: string; conflicts: unknown[] };
    keyInsights: string[];
  };
  overallRecommendation: {
    decision: string;
    confidence: string;
    reasoning: string[];
    averageRating: number;
  };
  nextSteps: string[];
}

export interface RecruitmentPlanResult {
  overview: {
    roles: string[];
    timeline: string;
    priority: string;
    totalPositions: number;
    estimatedDuration: number;
    status: string;
  };
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
  }>;
  sourcingStrategy: {
    channels: Array<{
      name: string;
      allocation: string;
      expectedCandidates: number;
      costPerHire: number;
    }>;
    targetSources: string[];
    messagingStrategy: {
      personalizedOutreach: string;
      responseRate: string;
      followUpSequence: string;
    };
  };
  milestones: Array<{
    week: number;
    milestone: string;
    deliverables: string[];
  }>;
  budgetBreakdown: {
    total?: number;
    breakdown?: Record<string, number>;
    costPerHire?: number;
    note?: string;
    estimatedRange?: string;
  };
  successMetrics: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    kpis: Record<string, string>;
  };
  riskMitigation: Record<string, string>;
  nextSteps: string[];
}

export interface MarketIntelligenceResult {
  role: string;
  location: string;
  experienceLevel: string;
  salaryData: {
    range: string;
    median: string;
    currency: string;
    equity: string;
    benefits: {
      healthInsurance: string;
      retirement: string;
      vacation: string;
      remoteWork: string;
    };
  };
  marketDemand: {
    level: string;
    score: number;
    [key: string]: unknown;
  };
  competitionAnalysis?: Record<string, unknown>;
  skillDemand: Array<{
    skill: string;
    demandLevel: string;
    salaryImpact: string;
    trendDirection: string;
  }>;
  hiringTrends?: Record<string, unknown>;
  recommendations: string[];
}

export interface ResumeParseResult {
  id: string;
  filename: string;
  parsedAt: string;
  contentType: string;
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    startDate: string | null;
    endDate: string | null;
    duration: string | null;
    responsibilities: string[];
    technologies: string[];
    location: string | null;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate: string | null;
    gpa: string | null;
  }>;
  skills: {
    technical: string[];
    frameworks: string[];
    tools: string[];
    soft: string[];
    certifications: string[];
  };
  analysis?: Record<string, unknown>;
  roleMatches?: Array<{
    role: string;
    score: number;
  }>;
}

export interface DocumentComparisonResult {
  comparison: {
    document1Summary: string;
    document2Summary: string;
    matchScore: number;
    matchLevel: string;
    keyMatches: string[];
    gaps: string[];
    recommendations: string[];
  };
}

export interface JobDescriptionEnhancement {
  original: { wordCount: number; readabilityScore: string };
  enhanced: {
    title: string;
    sections: Record<string, unknown>;
    wordCount: number;
    readabilityScore: string;
  };
  improvements: string[];
  seoKeywords: string[];
}

export interface JobRequirementsAnalysis {
  jobTitle: string;
  experienceLevel: string;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryInfo: { mentioned: boolean; range?: string };
  location: string;
  remoteOptions: string;
  companyInfo?: Record<string, unknown>;
  searchTerms: string[];
  complexity: string;
  recommendations: string[];
}

export interface ToolResultComponentProps {
  toolName: string;
  data: unknown;
  status: MCPToolResultStatus;
  onAction?: (action: string, payload?: unknown) => void;
}
