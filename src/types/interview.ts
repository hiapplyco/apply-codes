export interface InterviewContext {
  jobDescription: string;
  resume: string;
  companyRubric?: CompanyRubric;
  interviewType: InterviewFramework;
  candidateName: string;
  position: string;
  projectId: string;
}

export interface CompanyRubric {
  id: string;
  name: string;
  competencies: Competency[];
  scoringScale: ScoringScale;
  customQuestions?: string[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number;
  requiredLevel: number;
  questions: string[];
  indicators: string[];
}

export interface ScoringScale {
  min: number;
  max: number;
  labels: Record<number, string>;
}

export interface InterviewFramework {
  id: string;
  name: string;
  description: string;
  categories: QuestionCategory[];
}

export interface QuestionCategory {
  id: string;
  name: string;
  questions: InterviewQuestion[];
  timeAllocation: number; // minutes
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational' | 'cultural';
  competencyIds: string[];
  followUps: string[];
  expectedThemes: string[];
  scoringGuidance: string;
}

export interface InterviewSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  context: InterviewContext;
  transcript: TranscriptEntry[];
  analysis: InterviewAnalysis;
  scores: CompetencyScore[];
  flags: InterviewFlag[];
  suggestions: Suggestion[];
}

export interface TranscriptEntry {
  timestamp: Date;
  speaker: 'interviewer' | 'candidate';
  text: string;
  sentiment?: number;
  keyPhrases?: string[];
}

export interface InterviewAnalysis {
  competencyCoverage: Record<string, number>;
  responseQuality: ResponseQuality[];
  timeManagement: TimeTracking;
  skillMatch: SkillMatch;
  overallInsights: string[];
}

export interface ResponseQuality {
  questionId: string;
  depth: number; // 1-5
  relevance: number; // 1-5
  starMethodUsed: boolean;
  completeness: number; // 0-100
}

export interface TimeTracking {
  totalDuration: number;
  categoryBreakdown: Record<string, number>;
  pacing: 'too_fast' | 'optimal' | 'too_slow';
  warnings: string[];
}

export interface SkillMatch {
  requiredSkills: SkillAssessment[];
  additionalSkills: SkillAssessment[];
  overallMatch: number; // 0-100
}

export interface SkillAssessment {
  skill: string;
  required: boolean;
  demonstrated: boolean;
  evidence: string[];
  strength: number; // 1-5
}

export interface CompetencyScore {
  competencyId: string;
  score: number;
  confidence: number; // 0-100
  evidence: string[];
  aiRationale: string;
  humanAdjustment?: {
    newScore: number;
    rationale: string;
  };
}

export interface InterviewFlag {
  id: string;
  type: 'red_flag' | 'follow_up' | 'clarification' | 'positive';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
  suggestedAction: string;
}

export interface Suggestion {
  id: string;
  type: 'question' | 'technique' | 'follow_up' | 'coaching';
  priority: 'low' | 'medium' | 'high';
  text: string;
  timing: 'immediate' | 'next_pause' | 'later';
  reason: string;
  competencyId?: string;
}

export interface InterviewIntelligence {
  followUpOpportunities: FollowUp[];
  redFlags: RedFlag[];
  deepDiveAreas: string[];
  coachingTips: CoachingTip[];
}

export interface FollowUp {
  originalQuestion: string;
  candidateResponse: string;
  suggestedFollowUp: string;
  reason: string;
}

export interface RedFlag {
  type: 'inconsistency' | 'concerning_phrase' | 'experience_gap' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
  mitigation: string;
}

export interface CoachingTip {
  type: 'listening' | 'bias' | 'technique' | 'timing';
  message: string;
  context: string;
}

export interface VisualizationData {
  competencyCoverage: {
    labels: string[];
    values: number[];
    target: number[];
  };
  skillHeatmap: {
    skills: string[];
    categories: string[];
    data: number[][];
  };
  timeProgress: {
    elapsed: number;
    total: number;
    categoryBreakdown: { name: string; duration: number }[];
  };
  responseQuality: {
    questions: string[];
    depth: number[];
    relevance: number[];
    completeness: number[];
  };
}