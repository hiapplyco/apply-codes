import { supabase } from '@/integrations/supabase/client';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { FirecrawlService } from '@/utils/FirecrawlService';

export interface ContextContent {
  type: 'upload' | 'firecrawl' | 'perplexity';
  text: string;
  metadata?: Record<string, any>;
  projectId?: string;
}

export interface PipecatContext {
  sessionId?: string;
  meetingId?: string;
  context: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';
  projectId?: string;
}

export interface AgentOrchestrationConfig {
  enableRealTimeProcessing: boolean;
  agentTypes: string[];
  maxConcurrency: number;
  contextPropagation: boolean;
}

export class ContextIntegrationService {
  private static instance: ContextIntegrationService;
  private websockets: Map<string, WebSocket> = new Map();
  private activeAgents: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ContextIntegrationService {
    if (!ContextIntegrationService.instance) {
      ContextIntegrationService.instance = new ContextIntegrationService();
    }
    return ContextIntegrationService.instance;
  }

  /**
   * Process content with pipecat agent orchestration
   */
  public async processWithOrchestration(
    content: ContextContent,
    pipecatContext: PipecatContext,
    config: AgentOrchestrationConfig = {
      enableRealTimeProcessing: true,
      agentTypes: ['RecruitmentAgent', 'ProfileEnrichmentAgent'],
      maxConcurrency: 3,
      contextPropagation: true
    }
  ): Promise<any> {
    try {
      // Save raw content to database first
      await this.saveContextContent(content, pipecatContext);

      // If real-time processing is enabled, trigger agent orchestration
      if (config.enableRealTimeProcessing) {
        return await this.triggerAgentOrchestration(content, pipecatContext, config);
      }

      return { success: true, content };
    } catch (error) {
      console.error('Context integration orchestration error:', error);
      throw error;
    }
  }

  /**
   * Trigger agent orchestration with enhanced context
   */
  private async triggerAgentOrchestration(
    content: ContextContent,
    pipecatContext: PipecatContext,
    config: AgentOrchestrationConfig
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('test-orchestration', {
      body: {
        content: content.text,
        context: {
          ...pipecatContext,
          contentType: content.type,
          metadata: content.metadata
        },
        agentConfig: {
          agents: config.agentTypes,
          maxConcurrency: config.maxConcurrency,
          enableContextPropagation: config.contextPropagation
        }
      }
    });

    if (error) {
      console.error('Agent orchestration error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Save context content to database with project association
   */
  private async saveContextContent(
    content: ContextContent,
    pipecatContext: PipecatContext
  ): Promise<void> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Save to appropriate table based on content type
    switch (content.type) {
      case 'upload':
        await this.saveUploadContent(content, pipecatContext, user.id);
        break;
      case 'firecrawl':
        await this.saveFirecrawlContent(content, pipecatContext, user.id);
        break;
      case 'perplexity':
        await this.savePerplexityContent(content, pipecatContext, user.id);
        break;
    }
  }

  /**
   * Save uploaded document content
   */
  private async saveUploadContent(
    content: ContextContent,
    pipecatContext: PipecatContext,
    userId: string
  ): Promise<void> {
    const { error } = await supabase.from('project_scraped_data').insert({
      user_id: userId,
      project_id: pipecatContext.projectId,
      summary: content.text,
      raw_content: content.text,
      metadata: {
        ...content.metadata,
        context: pipecatContext.context,
        sessionId: pipecatContext.sessionId,
        meetingId: pipecatContext.meetingId,
        processingTimestamp: new Date().toISOString()
      },
      context: pipecatContext.context
    });

    if (error) {
      console.error('Failed to save upload content:', error);
      throw error;
    }
  }

  /**
   * Save Firecrawl scraped content
   */
  private async saveFirecrawlContent(
    content: ContextContent,
    pipecatContext: PipecatContext,
    userId: string
  ): Promise<void> {
    const { error } = await supabase.from('project_scraped_data').insert({
      user_id: userId,
      project_id: pipecatContext.projectId,
      url: content.metadata?.url,
      summary: content.text,
      raw_content: content.text,
      metadata: {
        ...content.metadata,
        context: pipecatContext.context,
        sessionId: pipecatContext.sessionId,
        meetingId: pipecatContext.meetingId,
        processingTimestamp: new Date().toISOString()
      },
      context: pipecatContext.context
    });

    if (error) {
      console.error('Failed to save Firecrawl content:', error);
      throw error;
    }
  }

  /**
   * Save Perplexity search results
   */
  private async savePerplexityContent(
    content: ContextContent,
    pipecatContext: PipecatContext,
    userId: string
  ): Promise<void> {
    const { error } = await supabase.from('searches').insert({
      user_id: userId,
      project_id: pipecatContext.projectId,
      query: content.metadata?.query || 'AI Search',
      platform: 'perplexity',
      results_count: content.metadata?.sources?.length || 0,
      filters_applied: {
        context: pipecatContext.context,
        sessionId: pipecatContext.sessionId,
        meetingId: pipecatContext.meetingId
      },
      metadata: {
        ...content.metadata,
        processingTimestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Failed to save Perplexity content:', error);
      throw error;
    }
  }

  /**
   * Establish WebSocket connection for real-time context propagation
   */
  public async connectWebSocket(
    sessionId: string,
    onMessage?: (data: any) => void
  ): Promise<WebSocket> {
    if (this.websockets.has(sessionId)) {
      return this.websockets.get(sessionId)!;
    }

    try {
      const { data: connectionData, error } = await supabase.functions.invoke('initialize-daily-bot', {
        body: { sessionId }
      });

      if (error || !connectionData?.websocketUrl) {
        throw new Error('Failed to get WebSocket URL');
      }

      const ws = new WebSocket(connectionData.websocketUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for session:', sessionId);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
        this.handleWebSocketMessage(sessionId, data);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected for session:', sessionId);
        this.websockets.delete(sessionId);
      };

      this.websockets.set(sessionId, ws);
      return ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WebSocket messages with context awareness
   */
  private async handleWebSocketMessage(sessionId: string, data: any): Promise<void> {
    try {
      // If message contains context content, process it
      if (data.type === 'context-content' && data.content) {
        const content: ContextContent = {
          type: data.contentType,
          text: data.content,
          metadata: data.metadata,
          projectId: data.projectId
        };

        const pipecatContext: PipecatContext = {
          sessionId,
          meetingId: data.meetingId,
          context: data.context,
          projectId: data.projectId
        };

        await this.processWithOrchestration(content, pipecatContext);
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
    }
  }

  /**
   * Send content to WebSocket for real-time processing
   */
  public async sendContentToWebSocket(
    sessionId: string,
    content: ContextContent,
    pipecatContext: PipecatContext
  ): Promise<void> {
    const ws = this.websockets.get(sessionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'context-content',
      contentType: content.type,
      content: content.text,
      metadata: content.metadata,
      projectId: content.projectId,
      context: pipecatContext.context,
      sessionId: pipecatContext.sessionId,
      meetingId: pipecatContext.meetingId,
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify(message));
  }

  /**
   * Get context content for a project
   */
  public async getProjectContext(
    projectId: string,
    context?: string
  ): Promise<any[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    let query = supabase
      .from('project_scraped_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (context) {
      query = query.eq('context', context);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to get project context:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Cleanup WebSocket connections
   */
  public cleanup(): void {
    this.websockets.forEach((ws, sessionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.websockets.clear();
    this.activeAgents.clear();
  }
}

export default ContextIntegrationService;