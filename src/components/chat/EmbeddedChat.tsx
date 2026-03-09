import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Bot,
  User,
  Loader2,
  Wrench,
  RefreshCw,
  Maximize2,
  Minimize2,
  Paperclip,
  FileText,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { useSubscription } from '@/hooks/useSubscription';
import { useProjectContext } from '@/context/ProjectContext';
import { useAgentSession } from '@/hooks/useAgentSession';
import { ContextBar } from '@/components/context/ContextBar';
import { useContextIntegration } from '@/hooks/useContextIntegration';
import { LinkedInCandidateList, LinkedInCandidate } from './LinkedInCandidateCard';
import { DocumentProcessor } from '@/lib/modernPdfProcessor';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { ToolResultRenderer } from './ToolResultRenderer';
import { ToolConfirmationDialog } from './ToolConfirmationDialog';
import { useMCPChat } from '@/hooks/useMCPChat';
import type { MCPToolResultEntry, PendingConfirmation } from '@/types/mcp-chat';

const MCP_CHAT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MCP_CHAT === 'true';

interface Message {
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
    complexity?: string;
    candidates?: LinkedInCandidate[];
  };
}

interface EmbeddedChatProps {
  className?: string;
  height?: string;
}

interface Attachment {
  name: string;
  type: string;
  content: string;
}

// Helper to parse candidates from message content
const parseCandidatesFromContent = (content: string): LinkedInCandidate[] | null => {
  // Try to find JSON in content - handle both raw JSON and ```json code blocks
  try {
    // First try to extract from markdown code block (handle various formats)
    const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = '';

    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
      console.log('[CandidateParser] Found code block, extracted JSON length:', jsonStr.length);
    } else {
      // Try to find raw JSON with profiles array
      const rawMatch = content.match(/\{\s*"profiles"\s*:\s*\[[\s\S]*\]\s*\}/);
      if (rawMatch) {
        jsonStr = rawMatch[0];
        console.log('[CandidateParser] Found raw JSON, length:', jsonStr.length);
      }
    }

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profiles && Array.isArray(parsed.profiles)) {
        console.log('[CandidateParser] Parsed', parsed.profiles.length, 'candidates');
        return parsed.profiles.map((p: any, idx: number) => ({
          id: p.id || `candidate-${idx}`,
          name: p.name || 'Unknown',
          title: p.title || p.jobTitle || '',
          company: p.company || '',
          location: p.location || '',
          profileUrl: p.profileUrl || p.link || '',
          summary: p.summary || p.snippet || '',
          skills: p.skills || [],
          matchScore: p.matchScore
        }));
      }
    }

    // Try direct array (no wrapper object)
    const arrayMatch = content.match(/\[\s*\{[\s\S]*"profileUrl"[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      const arr = JSON.parse(arrayMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((p: any, idx: number) => ({
          id: p.id || `candidate-${idx}`,
          name: p.name || 'Unknown',
          title: p.title || '',
          company: p.company || '',
          location: p.location || '',
          profileUrl: p.profileUrl || '',
          summary: p.summary || '',
          skills: p.skills || [],
          matchScore: p.matchScore
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse candidate JSON:', e);
    // Not valid JSON, continue to text parsing
  }

  // Fallback: Parse text format
  // Format: * Name - Title - Skills - URL
  // Or: * Name - Title - Description - Skills - URL
  const candidates: LinkedInCandidate[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') && trimmed.includes('linkedin.com/in/')) {
      const parts = trimmed.substring(2).split(' - ');
      const urlPart = parts.find(p => p.includes('linkedin.com/in/'));

      if (urlPart) {
        const url = urlPart.trim();
        // Remove URL from parts to process the rest
        const otherParts = parts.filter(p => !p.includes('linkedin.com/in/'));

        // Basic heuristic mapping
        const name = otherParts[0] || 'Unknown';
        const title = otherParts[1] || '';
        // If there are 4 parts (Name, Title, Desc, Skills), index 2 is desc, 3 is skills
        // If there are 3 parts (Name, Title, Skills), index 2 is skills
        const skillsStr = otherParts.length > 2 ? otherParts[otherParts.length - 1] : '';
        const summary = otherParts.length > 3 ? otherParts[2] : '';

        candidates.push({
          id: url,
          name: name.replace('Name not available', 'LinkedIn Member'),
          title,
          company: '',
          location: '',
          profileUrl: url,
          summary,
          skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
          matchScore: undefined
        });
      }
    }
  }

  return candidates.length > 0 ? candidates : null;
};

export const EmbeddedChat: React.FC<EmbeddedChatProps> = ({
  className,
  height = 'h-full'
}) => {
  const { selectedProjectId, selectedProject } = useProjectContext();
  const { checkAndExecute, UsageLimitModalComponent, isLimitReached } = useUsageLimit();
  const { incrementUsage } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [contextContent, setContextContent] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mcpMode, setMcpMode] = useState(MCP_CHAT_ENABLED);
  const [confirmationState, setConfirmationState] = useState<{
    open: boolean;
    pending: PendingConfirmation | null;
  }>({ open: false, pending: null });

  const { sessionId, setSessionId, setModelInfo, resetSession } = useAgentSession({
    projectId: selectedProjectId
  });

  const mcpChat = useMCPChat({
    sessionId,
    projectId: selectedProjectId,
    onSessionId: setSessionId,
    onModelInfo: (model: string) => setModelInfo(model, null),
  });

  // Context integration for chat
  const { processContent } = useContextIntegration({
    context: 'chat'
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, mcpChat.messages]);

  useEffect(() => {
    if (mcpMode && mcpChat.messages.length === 0) {
      mcpChat.setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your AI recruitment assistant with MCP tools. I can search for candidates, analyze documents, generate interview guides, create recruitment plans, and more.\n\nTry asking me to find candidates, analyze a job description, or create a recruitment plan.`,
        timestamp: new Date(),
      }]);
    }
    if (!mcpMode && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your AI recruitment assistant. I can help you with candidate sourcing, job analysis, market insights, and more.\n\nFeel free to upload documents, scrape websites, or ask me questions about your recruitment needs!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, mcpMode, mcpChat.messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContextContent = useCallback(async (content: any) => {
    try {
      await processContent(content);
      setContextContent(content.text);

      // Add context message to chat
      const contextMessage: Message = {
        id: `context-${Date.now()}`,
        role: 'assistant',
        content: `📎 Perfect! I've received and processed your ${content.type} content. This context will help me provide more relevant and specific responses to your questions.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, contextMessage]);

      toast.success(`${content.type} context added to chat`);
    } catch (error) {
      console.error('Chat context processing error:', error);
    }
  }, [processContent]);

  // Helper to save context item
  const saveContextItem = useCallback(async (item: any) => {
    if (!auth?.currentUser?.uid) return;

    try {
      await firestoreClient
        .from('context_items')
        .insert({
          ...item,
          user_id: auth.currentUser.uid,
          project_id: selectedProject?.id || selectedProjectId || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving context item:', error);
    }
  }, [selectedProject, selectedProjectId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!auth?.currentUser?.uid) {
      toast.error('You must be logged in to upload files');
      return;
    }

    setIsUploading(true);
    try {
      await DocumentProcessor.processDocument({
        file,
        userId: auth.currentUser.uid,
        onProgress: (status) => {
          // Only show toast for major status changes to avoid spamming
          if (!status.includes('complete') && !status.includes('failed')) {
            toast.info(status, { duration: 1500, id: 'upload-progress' });
          }
        },
        onComplete: async (content) => {
          toast.success('File processed successfully!', { id: 'upload-progress' });

          await saveContextItem({
            type: 'file_upload',
            title: `Uploaded: ${file.name}`,
            content: content,
            file_name: file.name,
            file_type: file.type,
            summary: content.substring(0, 200) + '...',
            metadata: {
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              success: true,
              timestamp: new Date().toISOString()
            }
          });

          // Add to attachments instead of immediate context injection
          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type,
            content: content
          }]);
        },
        onError: (err) => {
          toast.error(err, { id: 'upload-progress' });
        }
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isLimitReached('ai_calls')) {
      await checkAndExecute('ai_calls', async () => null);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input, // We'll combine content for sending but display the user's filtered input
      timestamp: new Date()
    };

    // If there are attachments, we might want to show them in the chat UI too?
    // For now, simpler to just treat them as hidden context or part of the message.
    // Let's indicate attachments in the user message for UI clarity
    if (attachments.length > 0) {
      userMessage.content = `${attachments.map(a => `[Attached: ${a.name}]`).join('\n')}\n${input}`;
    }

    setMessages(prev => [...prev, userMessage]);

    // Preparation for sending
    const currentInput = input;
    const currentAttachments = [...attachments];

    setInput('');
    setAttachments([]); // Clear attachments immediately
    setIsLoading(true);
    setActiveTools([]);

    abortControllerRef.current = new AbortController();

    try {
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      const token = await currentUser.getIdToken();

      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Include context and attachments
      const attachmentContext = currentAttachments
        .map(a => `[File Context: ${a.name}]\n${a.content}`)
        .join('\n\n');

      let combinedContent = currentInput;
      if (attachmentContext) {
        combinedContent = `${attachmentContext}\n\n${combinedContent}`;
      }
      if (contextContent) {
        combinedContent = `[Context: ${contextContent.substring(0, 500)}...]\n\n${combinedContent}`;
      }

      const messageWithContext = combinedContent;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageWithContext,
          session_id: sessionId,
          project_id: selectedProjectId,
          history
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming not supported');
      }

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '🔍 Searching for candidates... This may take 15-30 seconds as I generate the boolean search and find matching profiles.',
        timestamp: new Date(),
        isStreaming: true
      }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      const toolCalls: Array<{ name: string; status: string }> = [];
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'session':
                  if (data.session_id) setSessionId(data.session_id);
                  if (data.model) setModelInfo(data.model, data.complexity || null);
                  break;

                case 'token':
                  fullContent += data.content;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: fullContent }
                      : m
                  ));
                  break;

                case 'tool_call':
                  if (data.tool?.name) {
                    setActiveTools(prev => [...prev, data.tool.name]);
                    toolCalls.push({ name: data.tool.name, status: 'executing' });
                    toast.info(`Using tool: ${data.tool.name.replace(/_/g, ' ')}`);
                  }
                  break;

                case 'tool_result':
                  setActiveTools(prev => prev.filter(t => t !== data.tool));
                  const toolIndex = toolCalls.findIndex(t => t.name === data.tool);
                  if (toolIndex >= 0) {
                    toolCalls[toolIndex].status = 'complete';
                  }
                  break;

                case 'error':
                  toast.error(`Error: ${data.message}`);
                  break;

                case 'done':
                  // Parse candidates from the response if present
                  const candidates = parseCandidatesFromContent(fullContent);

                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? {
                        ...m,
                        content: fullContent || 'Response completed.',
                        isStreaming: false,
                        metadata: {
                          toolCalls,
                          candidates: candidates || undefined
                        }
                      }
                      : m
                  ));
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line, parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      incrementUsage('ai_calls').catch(err => console.error('Failed to increment AI calls usage:', err));

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveTools([]);
      abortControllerRef.current = null;
    }
  };

  const handleMCPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || mcpChat.isLoading) return;

    if (isLimitReached('ai_calls')) {
      await checkAndExecute('ai_calls', async () => null);
      return;
    }

    const currentInput = input;
    const currentAttachments = [...attachments];

    let displayContent = currentInput;
    if (currentAttachments.length > 0) {
      displayContent = `${currentAttachments.map(a => `[Attached: ${a.name}]`).join('\n')}\n${currentInput}`;
    }

    mcpChat.addUserMessage(displayContent);

    setInput('');
    setAttachments([]);

    const attachmentContext = currentAttachments
      .map(a => `[File Context: ${a.name}]\n${a.content}`)
      .join('\n\n');

    let combinedContent = currentInput;
    if (attachmentContext) {
      combinedContent = `${attachmentContext}\n\n${combinedContent}`;
    }
    if (contextContent) {
      combinedContent = `[Context: ${contextContent.substring(0, 500)}...]\n\n${combinedContent}`;
    }

    await mcpChat.sendMessage(combinedContent, {
      attachments: currentAttachments.map(a => ({ name: a.name, content: a.content })),
    });

    incrementUsage('ai_calls').catch(err => console.error('Failed to increment AI calls usage:', err));
  };

  const handleConfirmTool = async (approved: boolean) => {
    const pending = confirmationState.pending;
    if (!pending) return;

    setConfirmationState({ open: false, pending: null });

    const confirmMessage = approved
      ? `Confirmed: ${pending.tool.replace(/_/g, ' ')}`
      : `Cancelled: ${pending.tool.replace(/_/g, ' ')}`;

    mcpChat.addUserMessage(confirmMessage);

    await mcpChat.sendMessage(
      approved ? `Execute ${pending.tool}` : `I cancelled ${pending.tool}`,
      {
        confirmation: { pending, approved },
      }
    );
  };

  useEffect(() => {
    if (!mcpMode) return;
    const lastMsg = mcpChat.messages[mcpChat.messages.length - 1];
    if (lastMsg?.pendingConfirmation && !lastMsg.isStreaming) {
      setConfirmationState({
        open: true,
        pending: lastMsg.pendingConfirmation,
      });
    }
  }, [mcpMode, mcpChat.messages]);

  const handleCancel = () => {
    if (mcpMode) {
      mcpChat.cancel();
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setActiveTools([]);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setContextContent('');
    resetSession();
    if (mcpMode) {
      mcpChat.reset();
    }
    toast.success('Conversation reset');
  };

  const handleToolAction = useCallback((action: string, payload?: unknown) => {
    if (action === 'save') {
      const candidate = payload as LinkedInCandidate;
      toast.success(`Saved ${candidate?.name || 'candidate'} to project`);
    } else if (action === 'get_contact') {
      const candidate = payload as LinkedInCandidate;
      toast.info(`Getting contact info for ${candidate?.name || 'candidate'}...`);
      if (candidate?.profileUrl) {
        setInput(`Get contact info for ${candidate.name} (${candidate.profileUrl})`);
      }
    }
  }, []);

  const renderMCPToolResults = (toolResults: MCPToolResultEntry[]) => (
    <div className="space-y-2 mt-2">
      {toolResults.map((tr, idx) => (
        <ToolResultRenderer
          key={`${tr.tool}-${idx}`}
          toolName={tr.tool}
          result={tr.result}
          status={tr.status}
          onAction={handleToolAction}
        />
      ))}
    </div>
  );

  const renderMessageContent = (message: Message) => {
    const candidates = message.metadata?.candidates;
    const toolResults = message.toolResults;

    let displayText = message.content;
    if (candidates && candidates.length > 0) {
      displayText = displayText
        .replace(/```json[\s\S]*```/g, '')
        .replace(/\{\s*"profiles"\s*:\s*\[[\s\S]*\]\s*\}/g, '')
        .replace(/\* .*? - .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
        .replace(/\* .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    return (
      <>
        {displayText && (
          <p className="whitespace-pre-wrap">{displayText}</p>
        )}
        {toolResults && toolResults.length > 0 && renderMCPToolResults(toolResults)}
        {candidates && candidates.length > 0 && !toolResults?.length && (
          <LinkedInCandidateList
            candidates={candidates}
            onSave={(candidate) => {
              toast.success(`Saved ${candidate.name} to project`);
            }}
            onGetContact={(candidate) => {
              toast.info(`Getting contact info for ${candidate.name}...`);
              setInput(`Get contact info for ${candidate.name} (${candidate.profileUrl})`);
            }}
          />
        )}
      </>
    );
  };

  const displayMessages: Message[] = mcpMode
    ? mcpChat.messages.map(m => ({
        ...m,
        metadata: m.metadata ? {
          ...m.metadata,
          complexity: undefined,
          candidates: undefined,
        } : undefined,
      }))
    : messages;

  const displayIsLoading = mcpMode ? mcpChat.isLoading : isLoading;
  const displayActiveTools = mcpMode ? mcpChat.activeTools : activeTools;

  return (
    <>
      <UsageLimitModalComponent />
      {confirmationState.open && confirmationState.pending && (
        <ToolConfirmationDialog
          open={confirmationState.open}
          tool={confirmationState.pending.tool}
          description={confirmationState.pending.description}
          parameters={confirmationState.pending.args as Record<string, unknown>}
          onConfirm={() => handleConfirmTool(true)}
          onCancel={() => handleConfirmTool(false)}
        />
      )}
      <div className={cn(
        'flex flex-col bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden',
        height,
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900">AI Assistant</span>
              {selectedProject && (
                <span className="ml-2 text-xs text-gray-500">• {selectedProject.name}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {MCP_CHAT_ENABLED && (
              <Button
                variant={mcpMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMcpMode(!mcpMode)}
                className={cn(
                  'h-8 px-2 text-xs gap-1',
                  mcpMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'hover:bg-purple-100 text-gray-600'
                )}
                title={mcpMode ? 'MCP Tools active' : 'Enable MCP Tools'}
              >
                <Zap className="w-3.5 h-3.5" />
                MCP
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-10 h-10 p-0 hover:bg-purple-100"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-10 h-10 p-0 hover:bg-purple-100"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Context Bar */}
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <ContextBar
            context="chat"
            showProjectSelector={true}
            projectSelectorProps={{
              placeholder: "Select project (optional)",
              className: "w-full"
            }}
            onContentProcessed={handleContextContent}
            showLabels={false}
            size="sm"
            layout="horizontal"
            compact={true}
            className="border-none shadow-none bg-transparent p-0"
          />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-4 py-3 text-sm',
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {renderMessageContent(message)}

                  {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200/30 flex flex-wrap gap-1">
                      {message.metadata.toolCalls.map((tc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                          <Wrench className="w-3 h-3 mr-1" />
                          {tc.name.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className={cn(
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                  )}>
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {displayIsLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs text-gray-500">
                      {displayActiveTools.length > 0 ? 'Processing...' : 'Thinking...'}
                    </span>
                  </div>
                  {displayActiveTools.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {displayActiveTools.map((tool, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {tool.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="text-xs h-6 px-2 text-gray-500 hover:text-red-500"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {displayMessages.length <= 1 && (
          <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto">
            {[
              'Find AWS SageMaker architects',
              'Generate a boolean search',
              'Draft outreach email'
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => setInput(action)}
                className="px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 rounded-full whitespace-nowrap text-purple-700 border border-purple-200 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={mcpMode ? handleMCPSubmit : handleSubmit} className="p-3 border-t-2 border-gray-200 bg-gray-50">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 py-1 text-xs shadow-sm">
                  <FileText className="w-3 h-3 text-purple-600" />
                  <span className="max-w-[150px] truncate font-medium text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="px-3"
              disabled={displayIsLoading || isUploading}
              onClick={() => fileRef.current?.click()}
              title="Upload document"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mcpMode ? 'Ask with MCP tools...' : 'Ask me anything about recruitment...'}
              className="flex-1 text-sm bg-white border-gray-300 focus:border-purple-400"
              disabled={displayIsLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || displayIsLoading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 px-4"
            >
              {displayIsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EmbeddedChat;
