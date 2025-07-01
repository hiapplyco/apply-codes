export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RequestBody {
  message: string;
  systemPrompt?: string;
  history: ChatMessage[];
  sessionId?: number;
  userId?: string;
  projectId?: string;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
  result?: any;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  suggestedTools: string[];
  parameters: Record<string, any>;
  reasoning: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  toolCalls?: ToolCall[];
  metadata: {
    model: string;
    timestamp: string;
    intentAnalysis?: IntentAnalysis;
    agentOutputId?: number;
  };
}