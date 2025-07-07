import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface InterviewContext {
  sessionId: string;
  meetingId: string;
  jobRole: string;
  candidateId?: string;
  resumeSummary?: string;
  competencies: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    coverageLevel: number;
  }>;
  currentTopic?: string;
  stage: string;
}

interface TranscriptMessage {
  type: 'transcript';
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

interface ContextUpdateMessage {
  type: 'context_update';
  context: Partial<InterviewContext>;
}

interface GuidanceRequest {
  type: 'guidance_request';
  competencyId?: string;
  urgency?: 'high' | 'medium' | 'low';
}

class InterviewGuidanceSession {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private context: InterviewContext | null = null;
  private recentTranscripts: TranscriptMessage[] = [];
  private socket: WebSocket;
  private analysisBuffer: TranscriptMessage[] = [];
  private analysisTimer: number | null = null;
  private readonly ANALYSIS_DEBOUNCE_MS = 3000; // 3 seconds
  private readonly MAX_TRANSCRIPTS = 20;
  private readonly IMMEDIATE_CONTEXT_SIZE = 3;

  constructor(socket: WebSocket, apiKey: string) {
    this.socket = socket;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });
  }

  async handleMessage(data: Record<string, any>) {
    try {
      switch (data.type) {
        case 'context_update':
          await this.updateContext(data as ContextUpdateMessage);
          break;
        
        case 'transcript':
          await this.handleTranscript(data as TranscriptMessage);
          break;
        
        case 'guidance_request':
          await this.generateGuidance(data as GuidanceRequest);
          break;
        
        case 'competency_check':
          await this.checkCompetencyCoverage();
          break;
        
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(error.message);
    }
  }

  private async updateContext(message: ContextUpdateMessage) {
    this.context = { ...this.context, ...message.context } as InterviewContext;
    this.sendAck('context_updated');
  }

  private async handleTranscript(message: TranscriptMessage) {
    // Add to recent transcripts
    this.recentTranscripts.push(message);
    if (this.recentTranscripts.length > this.MAX_TRANSCRIPTS) {
      this.recentTranscripts.shift();
    }

    // Add to analysis buffer
    this.analysisBuffer.push(message);

    // Debounce analysis
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }

    this.analysisTimer = setTimeout(() => {
      this.analyzeBufferedTranscripts();
    }, this.ANALYSIS_DEBOUNCE_MS);
  }

  private async analyzeBufferedTranscripts() {
    if (this.analysisBuffer.length === 0 || !this.context) return;

    const transcriptsToAnalyze = [...this.analysisBuffer];
    this.analysisBuffer = [];

    try {
      // Check for competency mentions
      const mentionedCompetencies = this.extractCompetencyMentions(
        transcriptsToAnalyze.map(t => t.text).join(' ')
      );

      // Update coverage for mentioned competencies
      for (const competencyId of mentionedCompetencies) {
        const coverage = this.calculateCoverageScore(competencyId);
        this.socket.send(JSON.stringify({
          type: 'coverage_update',
          competencyId,
          coverage,
        }));
      }

      // Generate contextual tips if needed
      const shouldGenerateTip = this.shouldGenerateTip(transcriptsToAnalyze);
      if (shouldGenerateTip) {
        await this.generateContextualTip();
      }

    } catch (error) {
      console.error('Error analyzing transcripts:', error);
    }
  }

  private extractCompetencyMentions(text: string): string[] {
    if (!this.context) return [];
    
    const mentioned: string[] = [];
    const lowerText = text.toLowerCase();

    for (const competency of this.context.competencies) {
      if (lowerText.includes(competency.name.toLowerCase()) ||
          this.containsKeywords(lowerText, competency.description)) {
        mentioned.push(competency.id);
      }
    }

    return mentioned;
  }

  private containsKeywords(text: string, description: string): boolean {
    const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    return matchCount >= 2;
  }

  private calculateCoverageScore(competencyId: string): number {
    if (!this.context) return 0;

    const competency = this.context.competencies.find(c => c.id === competencyId);
    if (!competency) return 0;

    const relevantTranscripts = this.recentTranscripts.filter(t =>
      this.extractCompetencyMentions(t.text).includes(competencyId)
    );

    const baseCoverage = Math.min(relevantTranscripts.length * 15, 60);
    const qualityBonus = relevantTranscripts
      .filter(t => t.speaker === 'candidate' && t.text.length > 50)
      .length * 10;

    return Math.min(baseCoverage + qualityBonus, 100);
  }

  private shouldGenerateTip(transcripts: TranscriptMessage[]): boolean {
    // Generate tip if:
    // 1. Candidate just finished a long response
    // 2. Topic seems to be changing
    // 3. Been a while since last tip
    const lastTranscript = transcripts[transcripts.length - 1];
    return (
      lastTranscript.speaker === 'candidate' && 
      lastTranscript.text.length > 100
    );
  }

  private async generateContextualTip() {
    if (!this.context) return;

    const immediateContext = this.recentTranscripts.slice(-this.IMMEDIATE_CONTEXT_SIZE);
    const prompt = this.buildGuidancePrompt(immediateContext);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const tips = this.parseTipsFromResponse(response.text());

      for (const tip of tips) {
        this.socket.send(JSON.stringify({
          type: 'tip',
          tip,
        }));
      }
    } catch (error) {
      console.error('Error generating tips:', error);
    }
  }

  private buildGuidancePrompt(immediateContext: TranscriptMessage[]): string {
    if (!this.context) return '';

    const competenciesText = this.context.competencies
      .map(c => `- ${c.name} (${c.category}, ${c.coverageLevel}% covered)`)
      .join('\n');

    const transcriptText = immediateContext
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const uncoveredCompetencies = this.context.competencies
      .filter(c => c.coverageLevel < 30)
      .map(c => c.name)
      .join(', ');

    return `ROLE: Expert interview coach providing real-time guidance.

INTERVIEW CONTEXT:
Position: ${this.context.jobRole}
Stage: ${this.context.stage}
Current Topic: ${this.context.currentTopic || 'General discussion'}

COMPETENCIES STATUS:
${competenciesText}

RECENT EXCHANGE:
${transcriptText}

UNCOVERED COMPETENCIES: ${uncoveredCompetencies || 'All competencies have basic coverage'}

TASK: Provide 2-3 concise, actionable tips for the interviewer. Focus on:
1. How to improve the current line of questioning
2. Natural transitions to uncovered competencies
3. Specific follow-up questions

FORMAT: Return a JSON array of tips, each with:
- type: "content" | "delivery" | "competency" | "follow-up"
- priority: "high" | "medium" | "low"
- message: Brief tip (max 50 words)
- suggestedQuestion: (optional) Specific question to ask

Keep tips brief and immediately actionable.`;
  }

  private parseTipsFromResponse(responseText: string): InterviewTip[] {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tips = JSON.parse(jsonMatch[0]);
        return tips.map((tip: Record<string, any>) => ({
          id: crypto.randomUUID(),
          type: tip.type || 'content',
          priority: tip.priority || 'medium',
          message: tip.message,
          suggestedQuestion: tip.suggestedQuestion,
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error parsing tips:', error);
    }

    // Fallback to a generic tip
    return [{
      id: crypto.randomUUID(),
      type: 'content',
      priority: 'low',
      message: 'Continue exploring the candidate\'s experience',
      timestamp: new Date().toISOString(),
    }];
  }

  private async generateGuidance(request: GuidanceRequest) {
    if (!this.context) {
      this.sendError('No context available');
      return;
    }

    // Generate specific guidance based on request
    await this.generateContextualTip();
  }

  private async checkCompetencyCoverage() {
    if (!this.context) return;

    const coverageReport = this.context.competencies.map(c => ({
      id: c.id,
      name: c.name,
      coverage: this.calculateCoverageScore(c.id),
      category: c.category,
    }));

    this.socket.send(JSON.stringify({
      type: 'coverage_report',
      competencies: coverageReport,
    }));
  }

  private sendAck(action: string) {
    this.socket.send(JSON.stringify({ type: 'ack', action }));
  }

  private sendError(message: string) {
    this.socket.send(JSON.stringify({ type: 'error', message }));
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const upgradeHeader = req.headers.get("upgrade");

    // Return WebSocket URL if not upgrading
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      const host = req.headers.get("host") || "";
      const wsProtocol = host.includes("localhost") ? "ws" : "wss";
      const wsUrl = `${wsProtocol}://${host}/functions/v1/interview-guidance-ws`;
      
      return new Response(
        JSON.stringify({
          success: true,
          websocket_url: wsUrl
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get Gemini API key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);
    let session: InterviewGuidanceSession | null = null;

    socket.onopen = () => {
      console.log("Interview guidance WebSocket connected");
      session = new InterviewGuidanceSession(socket, GEMINI_API_KEY);
      socket.send(JSON.stringify({
        type: 'connected',
        message: 'Interview guidance system ready'
      }));
    };

    socket.onmessage = async (event) => {
      if (!session) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Session not initialized'
        }));
        return;
      }

      try {
        const data = JSON.parse(event.data);
        await session.handleMessage(data);
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Interview guidance WebSocket closed");
      session = null;
    };

    return response;

  } catch (error) {
    console.error('Error in interview-guidance-ws:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to initialize interview guidance',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});