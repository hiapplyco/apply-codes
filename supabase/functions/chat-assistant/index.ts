import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { ToolRegistry } from "./tools.ts";
import { IntentAnalyzer } from "./intent-analyzer.ts";
import { StorageManager } from "./storage.ts";
import { RequestBody, ChatResponse, ToolCall } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, systemPrompt, history, sessionId, userId, projectId } = await req.json() as RequestBody;

    if (!message) {
      throw new Error('Message is required');
    }

    // Initialize services
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const genAI = new GoogleGenerativeAI(apiKey);
    const toolRegistry = new ToolRegistry(supabaseUrl, supabaseKey);
    const intentAnalyzer = new IntentAnalyzer(genAI, toolRegistry.getDescriptions());
    const storage = new StorageManager(supabaseUrl, supabaseKey);

    // Get session context if available
    let sessionContext = { messages: [], session: null, agentOutputs: [] };
    if (sessionId) {
      sessionContext = await storage.getSessionContext(sessionId);
    }

    // Analyze user intent
    console.log('Analyzing user intent...');
    const intentAnalysis = await intentAnalyzer.analyzeIntent(message, history);
    console.log('Intent analysis:', intentAnalysis);

    // Execute suggested tools
    const toolCalls: ToolCall[] = [];
    
    for (const toolName of intentAnalysis.suggestedTools) {
      const tool = toolRegistry.get(toolName);
      if (!tool) {
        console.warn(`Tool ${toolName} not found`);
        continue;
      }

      const params = intentAnalysis.parameters[toolName] || {};
      console.log(`Executing tool: ${toolName}`, params);
      
      try {
        const result = await tool.execute(params);
        toolCalls.push({
          tool: toolName,
          parameters: params,
          result
        });
      } catch (error) {
        console.error(`Tool ${toolName} failed:`, error);
        toolCalls.push({
          tool: toolName,
          parameters: params,
          result: { error: error.message }
        });
      }
    }

    // Generate contextual response
    const response = await intentAnalyzer.generateContextualResponse(
      message,
      intentAnalysis,
      toolCalls,
      history
    );

    // Save agent output if user is authenticated
    let agentOutputId = null;
    if (userId) {
      agentOutputId = await storage.saveAgentOutput({
        userId,
        sessionId,
        projectId,
        agentType: 'chat_assistant',
        intent: intentAnalysis,
        toolCalls,
        response,
        metadata: {
          systemPrompt,
          model: 'gemini-2.5-flash'
        }
      });
    }

    // Save chat messages if session exists
    if (sessionId) {
      await storage.saveChatMessage({
        sessionId,
        role: 'user',
        content: message,
        metadata: { intentAnalysis }
      });
      
      await storage.saveChatMessage({
        sessionId,
        role: 'assistant',
        content: response,
        metadata: { toolCalls, agentOutputId }
      });
    }

    // Return the response
    const chatResponse: ChatResponse = {
      response,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      metadata: {
        model: "gemini-2.5-flash",
        timestamp: new Date().toISOString(),
        intentAnalysis,
        agentOutputId
      }
    };

    return new Response(
      JSON.stringify(chatResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred processing your request',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});