export interface InterviewCompetency {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'behavioral' | 'cultural';
  required: boolean;
  coverageLevel: number; // 0-100 percentage
  lastCoveredAt?: Date;
}

export interface InterviewContext {
  sessionId: string;
  meetingId: string;
  jobRole: string;
  candidateId?: string;
  resumeSummary?: string;
  competencies: InterviewCompetency[];
  currentTopic?: string;
  stage: 'intro' | 'technical' | 'behavioral' | 'questions' | 'closing';
}

export interface TranscriptSegment {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
  analyzed: boolean;
}

export interface InterviewTip {
  id: string;
  type: 'content' | 'delivery' | 'competency' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  message: string;
  competencyId?: string;
  suggestedQuestion?: string;
  timestamp: Date;
}

export interface RealtimeInterviewState {
  context: InterviewContext;
  recentTranscripts: TranscriptSegment[];
  activeTips: InterviewTip[];
  competencyCoverage: Map<string, number>;
  isRecording: boolean;
  isTranscribing: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface InterviewGuidanceConfig {
  maxTipsVisible: number;
  tipDisplayDuration: number; // milliseconds
  transcriptBufferSize: number; // number of segments to keep
  analysisDebounceMs: number;
  geminiModel: string;
  enableAutoSuggestions: boolean;
}