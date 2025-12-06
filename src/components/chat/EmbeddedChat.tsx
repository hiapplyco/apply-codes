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
  Minimize2
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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

  const { sessionId, setSessionId, setModelInfo, resetSession } = useAgentSession({
    projectId: selectedProjectId
  });

  // Context integration for chat
  const { processContent } = useContextIntegration({
    context: 'chat'
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your AI recruitment assistant. I can help you with candidate sourcing, job analysis, market insights, and more. 

Feel free to upload documents, scrape websites, or ask me questions about your recruitment needs!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

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
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
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

      // Include context in the message if available
      const messageWithContext = contextContent
        ? `[Context: ${contextContent.substring(0, 500)}...]\n\n${currentInput}`
        : currentInput;

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

  const handleCancel = () => {
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
    toast.success('Conversation reset');
  };

  // Render message content with candidate cards if present
  const renderMessageContent = (message: Message) => {
    const candidates = message.metadata?.candidates;

    // Remove JSON data from display text if we have parsed candidates
    let displayText = message.content;
    if (candidates && candidates.length > 0) {
      // Clean up the text by removing the raw JSON and code blocks
      displayText = displayText
        // Remove entire ```json ... ``` code blocks (greedy)
        .replace(/```json[\s\S]*```/g, '')
        // Remove raw JSON with profiles array (greedy)
        .replace(/\{\s*"profiles"\s*:\s*\[[\s\S]*\]\s*\}/g, '')
        // Also remove the text list format to avoid duplication
        .replace(/\* .*? - .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
        .replace(/\* .*? - .*? - https:\/\/www\.linkedin\.com\/in\/.*/g, '')
        // Clean up multiple newlines and whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    return (
      <>
        {displayText && (
          <p className="whitespace-pre-wrap">{displayText}</p>
        )}
        {candidates && candidates.length > 0 && (
          <LinkedInCandidateList
            candidates={candidates}
            onSave={(candidate) => {
              toast.success(`Saved ${candidate.name} to project`);
              // Here we would call an API to save the candidate
            }}
            onGetContact={(candidate) => {
              toast.info(`Getting contact info for ${candidate.name}...`);
              // Trigger a new message to the agent to get contact info
              setInput(`Get contact info for ${candidate.name} (${candidate.profileUrl})`);
              // We can't auto-submit from here easily without refactoring, but pre-filling helps
            }}
          />
        )}
      </>
    );
  };

  return (
    <>
      <UsageLimitModalComponent />
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-8 h-8 p-0 hover:bg-purple-100"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 p-0 hover:bg-purple-100"
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
            {messages.map((message) => (
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
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-xs text-gray-500">
                      {activeTools.length > 0 ? 'Processing...' : 'Thinking...'}
                    </span>
                  </div>
                  {activeTools.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeTools.map((tool, idx) => (
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
        {messages.length <= 1 && (
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
        <form onSubmit={handleSubmit} className="p-3 border-t-2 border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about recruitment..."
              className="flex-1 text-sm bg-white border-gray-300 focus:border-purple-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 px-4"
            >
              {isLoading ? (
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
