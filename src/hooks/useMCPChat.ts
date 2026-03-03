import { useState, useRef, useCallback } from 'react';
import { streamMCPChat, buildConfirmationPayload } from '@/lib/mcp-chat-service';
import type {
  MCPChatEvent,
  MCPToolResultEntry,
  PendingConfirmation,
  MCPToolResultStatus,
} from '@/types/mcp-chat';

export interface MCPMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolResults?: MCPToolResultEntry[];
  pendingConfirmation?: PendingConfirmation;
  metadata?: {
    toolCalls?: Array<{ name: string; status: string }>;
    model?: string;
  };
}

interface UseMCPChatOptions {
  sessionId: string | null;
  projectId?: string | null;
  onSessionId?: (id: string) => void;
  onModelInfo?: (model: string) => void;
}

export function useMCPChat(options: UseMCPChatOptions) {
  const { sessionId, projectId, onSessionId, onModelInfo } = options;
  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    input: string,
    extraOptions?: {
      history?: Array<{ role: string; content: string }>;
      attachments?: Array<{ name: string; content: string }>;
      confirmation?: Parameters<typeof buildConfirmationPayload>[0] extends PendingConfirmation
        ? { pending: PendingConfirmation; approved: boolean }
        : never;
    }
  ) => {
    if (!input.trim() && !extraOptions?.confirmation) return;

    setIsLoading(true);
    setActiveTools([]);

    abortControllerRef.current = new AbortController();

    const assistantMsgId = `mcp-${Date.now()}`;
    let fullContent = '';
    const toolCalls: Array<{ name: string; status: string }> = [];
    const toolResults: MCPToolResultEntry[] = [];

    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    const updateAssistantMessage = (updates: Partial<MCPMessage>) => {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, ...updates } : m
      ));
    };

    const history = extraOptions?.history || messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const confirmation = extraOptions?.confirmation
      ? buildConfirmationPayload(extraOptions.confirmation.pending, extraOptions.confirmation.approved)
      : undefined;

    const handleEvent = (event: MCPChatEvent) => {
      switch (event.type) {
        case 'session':
          if (event.session_id && onSessionId) onSessionId(event.session_id);
          if (event.model && onModelInfo) onModelInfo(event.model);
          break;

        case 'token':
          fullContent += event.content;
          updateAssistantMessage({ content: fullContent });
          break;

        case 'tool_call':
          if (event.tool?.name) {
            setActiveTools(prev => [...prev, event.tool.name]);
            toolCalls.push({ name: event.tool.name, status: 'executing' });
          }
          break;

        case 'tool_progress':
          break;

        case 'tool_result': {
          setActiveTools(prev => prev.filter(t => t !== event.tool));
          const idx = toolCalls.findIndex(t => t.name === event.tool);
          if (idx >= 0) toolCalls[idx].status = event.status;
          toolResults.push({
            tool: event.tool,
            result: event.result,
            status: event.status as MCPToolResultStatus,
          });
          updateAssistantMessage({ toolResults: [...toolResults] });
          break;
        }

        case 'error':
          fullContent += `\n[Error: ${event.message}]`;
          updateAssistantMessage({ content: fullContent });
          break;

        case 'done':
          updateAssistantMessage({
            content: fullContent || 'Response completed.',
            isStreaming: false,
            toolResults: toolResults.length > 0 ? [...toolResults] : undefined,
            pendingConfirmation: event.pendingConfirmation || undefined,
            metadata: {
              toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
            },
          });
          break;
      }
    };

    try {
      await streamMCPChat({
        message: input,
        sessionId,
        projectId,
        history,
        confirmation,
        attachments: extraOptions?.attachments,
        signal: abortControllerRef.current.signal,
        onEvent: handleEvent,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;

      console.error('[useMCPChat] Stream error:', error);
      updateAssistantMessage({
        content: 'Sorry, I encountered an error. Please try again.',
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
      setActiveTools([]);
      abortControllerRef.current = null;
    }
  }, [sessionId, projectId, messages, onSessionId, onModelInfo]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setActiveTools([]);
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setActiveTools([]);
  }, []);

  const addUserMessage = useCallback((content: string, id?: string) => {
    const msg: MCPMessage = {
      id: id || `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  return {
    messages,
    isLoading,
    activeTools,
    sendMessage,
    cancel,
    reset,
    addUserMessage,
    setMessages,
  };
}
