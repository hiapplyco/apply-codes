import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { IntentAnalysis, ToolCall } from "./types.ts";

export class StorageManager {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveAgentOutput(data: {
    userId: string;
    sessionId?: number;
    projectId?: string;
    agentType: string;
    intent: IntentAnalysis;
    toolCalls: ToolCall[];
    response: string;
    metadata?: any;
  }): Promise<number | null> {
    try {
      // First, ensure we have a job record or create a placeholder
      let jobId = null;
      
      // If we have context about a job, try to find or create it
      if (data.intent.parameters.requirements || data.intent.parameters.content) {
        const content = data.intent.parameters.requirements || data.intent.parameters.content || '';
        
        const { data: jobData, error: jobError } = await this.supabase
          .from('jobs')
          .insert({
            user_id: data.userId,
            content: content,
            source: 'chat_assistant',
            search_string: data.toolCalls.find(tc => tc.tool === 'generate_boolean_search')?.result?.searchString || '',
            project_id: data.projectId
          })
          .select('id')
          .single();

        if (!jobError && jobData) {
          jobId = jobData.id;
        }
      }

      // Structure the output data
      const outputData = {
        intent: data.intent,
        toolCalls: data.toolCalls,
        response: data.response,
        metadata: {
          ...data.metadata,
          sessionId: data.sessionId,
          projectId: data.projectId,
          timestamp: new Date().toISOString()
        }
      };

      // Store in agent_outputs table
      const { data: agentOutput, error } = await this.supabase
        .from('agent_outputs')
        .insert({
          job_id: jobId,
          agent_type: data.agentType,
          output_data: outputData,
          project_id: data.projectId,
          // Map specific tool results to columns if applicable
          compensation_analysis: data.toolCalls.find(tc => tc.tool === 'analyze_compensation')?.result?.analysis || null,
          enhanced_description: data.toolCalls.find(tc => tc.tool === 'enhance_job_description')?.result?.enhancedDescription || null,
          job_summary: data.toolCalls.find(tc => tc.tool === 'summarize_job')?.result?.summary || null,
          terms: data.toolCalls.find(tc => tc.tool === 'extract_nlp_terms')?.result?.terms || null
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving agent output:', error);
        return null;
      }

      return agentOutput?.id || null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }

  async saveChatMessage(data: {
    sessionId: number;
    role: string;
    content: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: data.sessionId,
          role: data.role,
          content: data.content,
          metadata: data.metadata
        });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Chat message storage error:', error);
    }
  }

  async getSessionContext(sessionId: number): Promise<any> {
    try {
      // Get recent messages
      const { data: messages } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get session info
      const { data: session } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      // Get related agent outputs if any
      const { data: agentOutputs } = await this.supabase
        .from('agent_outputs')
        .select('*')
        .eq('project_id', session?.project_id)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        messages: messages?.reverse() || [],
        session,
        agentOutputs: agentOutputs || []
      };
    } catch (error) {
      console.error('Error getting session context:', error);
      return { messages: [], session: null, agentOutputs: [] };
    }
  }
}