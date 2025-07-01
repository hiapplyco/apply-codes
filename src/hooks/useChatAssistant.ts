import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

interface IntentAnalysis {
  intent: string;
  confidence: number;
  suggestedTools: string[];
  parameters: Record<string, unknown>;
  reasoning: string;
}

interface ChatResponse {
  response: string;
  toolCalls?: ToolCall[];
  metadata: {
    model: string;
    timestamp: string;
    intentAnalysis?: IntentAnalysis;
    agentOutputId?: number;
  };
}

export function useChatAssistant(sessionId?: number, projectId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastToolCalls, setLastToolCalls] = useState<ToolCall[]>([]);
  const { toast } = useToast();

  const sendMessage = useCallback(async (message: string, systemPrompt?: string) => {
    setIsLoading(true);
    
    try {
      // Add user message to history
      const newUserMessage: ChatMessage = { role: 'user', content: message };
      setMessages(prev => [...prev, newUserMessage]);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Call the chat assistant edge function
      const { data, error } = await supabase.functions.invoke<ChatResponse>('chat-assistant', {
        body: {
          message,
          systemPrompt: systemPrompt || 'You are an expert recruitment AI assistant. Help users find candidates, create job descriptions, analyze compensation, and provide recruitment insights.',
          history: messages,
          sessionId,
          userId: user?.id,
          projectId
        }
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No response from chat assistant');
      }

      // Add assistant response to history
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Store tool calls if any
      if (data.toolCalls) {
        setLastToolCalls(data.toolCalls);
      }

      // Show toast for tool usage
      if (data.toolCalls && data.toolCalls.length > 0) {
        const toolNames = data.toolCalls.map(tc => tc.tool).join(', ');
        toast({
          title: 'AI Tools Used',
          description: `Applied: ${toolNames}`,
          duration: 3000,
        });
      }

      return data;
    } catch (error) {
      console.error('Chat assistant error:', error);
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, projectId, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastToolCalls([]);
  }, []);

  const getToolResult = useCallback((toolName: string) => {
    const toolCall = lastToolCalls.find(tc => tc.tool === toolName);
    return toolCall?.result;
  }, [lastToolCalls]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    lastToolCalls,
    getToolResult
  };
}