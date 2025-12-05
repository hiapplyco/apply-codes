import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  Move,
  Wrench,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewAuth } from '@/context/NewAuthContext';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ContextBar } from '@/components/context/ContextBar';
import { useContextIntegration } from '@/hooks/useContextIntegration';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import { useSubscription } from '@/hooks/useSubscription';
import { useProjectContext } from '@/context/ProjectContext';
import { useAgentSession } from '@/hooks/useAgentSession';
import { useToolConfirmation, HIGH_IMPACT_TOOLS } from '@/components/chat/ToolConfirmationDialog';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    searchCount?: number;
    projectCount?: number;
    candidateCount?: number;
    toolCalls?: Array<{ name: string; status: string }>;
    model?: string;
    complexity?: string;
  };
}

interface FloatingChatBotProps {
  /** Page context for targeted responses */
  context?: 'sourcing' | 'meeting' | 'chat' | 'job-posting' | 'screening' | 'general';

  /** Custom position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /** Custom styling */
  className?: string;
}

export const FloatingChatBot: React.FC<FloatingChatBotProps> = ({
  context = 'general',
  position = 'bottom-right',
  className
}) => {
  const { user } = useNewAuth();
  const { selectedProjectId, selectedProject } = useProjectContext();
  const { checkAndExecute, UsageLimitModalComponent, isLimitReached } = useUsageLimit();
  const { incrementUsage } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextContent, setContextContent] = useState<string>('');
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ADK Agent session management
  const { sessionId, setSessionId, setModelInfo, resetSession } = useAgentSession({
    projectId: selectedProjectId
  });

  // Tool confirmation
  const { ConfirmationDialog, requestConfirmation, isToolHighImpact } = useToolConfirmation();

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Context integration for chat
  const { processContent } = useContextIntegration({
    context: 'chat'
  });

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize chat with welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your AI recruitment assistant. I can help you with candidate sourcing, job analysis, market insights, and more. \n\nFeel free to upload documents, scrape websites, or ask me questions about your recruitment needs!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check AI calls usage limit
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

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Get Firebase ID token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Prepare history for context
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call ADK agent streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: sessionId,
          project_id: selectedProjectId,
          history
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      // Create streaming assistant message
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      const toolCalls: Array<{ name: string; status: string }> = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'session':
                  // Update session info
                  if (data.session_id) setSessionId(data.session_id);
                  if (data.model) setModelInfo(data.model, data.complexity || null);
                  break;

                case 'token':
                  // Append token to message
                  fullContent += data.content;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: fullContent }
                      : m
                  ));
                  break;

                case 'tool_call':
                  // Show tool execution
                  if (data.tool?.name) {
                    setActiveTools(prev => [...prev, data.tool.name]);
                    toolCalls.push({ name: data.tool.name, status: 'executing' });
                    toast.info(`Using tool: ${data.tool.name.replace(/_/g, ' ')}`);
                  }
                  break;

                case 'tool_result':
                  // Update tool status
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
                  // Finalize message
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: fullContent || 'Response completed.',
                          isStreaming: false,
                          metadata: { toolCalls }
                        }
                      : m
                  ));
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      // Increment AI calls usage after successful response
      incrementUsage('ai_calls').catch(err => console.error('Failed to increment AI calls usage:', err));

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request was cancelled');
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

  // Cancel ongoing request
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setActiveTools([]);
    }
  };

  // Reset conversation
  const handleReset = () => {
    setMessages([]);
    resetSession();
    toast.success('Conversation reset');
  };

  const handleContextContent = async (content: any) => {
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
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = (isOpen ? chatRef : dragRef).current?.getBoundingClientRect();
    if (rect) {
      setDragPosition({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragPosition.x;
    const newY = clientY - dragPosition.y;

    // Ensure it stays within viewport
    const maxX = window.innerWidth - (isOpen ? 384 : 56); // 384px = w-96, 56px = w-14
    const maxY = window.innerHeight - (isOpen ? 600 : 56);

    setCustomPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  }, [isDragging, dragPosition, isOpen]);

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleDragMove]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  // Get position style
  const getPositionStyle = () => {
    if (customPosition) {
      return {
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
        right: 'auto',
        bottom: 'auto'
      };
    }
    return {};
  };

  // Chat trigger button
  if (!isOpen) {
    return (
      <>
        <UsageLimitModalComponent />
        <div
          ref={dragRef}
          className={cn(
            "fixed z-50 w-14 h-14",
            !customPosition && positionClasses[position],
            isDragging && "cursor-grabbing",
            className
          )}
          style={getPositionStyle()}
        >
          <Button
          onClick={() => setIsOpen(true)}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={cn(
            "w-full h-full rounded-full bg-purple-600 hover:bg-purple-700 text-white",
            "border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-200",
            "cursor-move active:cursor-grabbing"
          )}
          type="button"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Drag to move • Click to open
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <UsageLimitModalComponent />
      {ConfirmationDialog}
      <div
        ref={chatRef}
        className={cn(
          "fixed z-50 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-lg",
        "flex flex-col transition-all duration-300",
        !customPosition && positionClasses[position],
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
        isDragging && "select-none",
        className
      )}
      style={getPositionStyle()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b-2 border-black bg-purple-50 rounded-t-lg cursor-move"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-900">AI Assistant</span>
          {selectedProject && (
            <Badge variant="outline" className="text-xs bg-purple-50">
              {selectedProject.name}
            </Badge>
          )}
          {isDragging && <Move className="w-4 h-4 text-purple-600 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-8 h-8 p-0 hover:bg-purple-100"
            type="button"
            title="Reset conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 p-0 hover:bg-purple-100"
            type="button"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 p-0 hover:bg-red-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Context Bar */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <ContextBar
              context={context}
              title="Add Context"
              description="Upload, scrape, or search to enhance responses"
              onContentProcessed={handleContextContent}
              showProjectSelector={true}
              projectSelectorProps={{
                placeholder: "Select project (optional)",
                className: "w-full"
              }}
              showLabels={false}
              size="sm"
              layout="vertical"
              compact={true}
              className="border-none shadow-none bg-transparent p-2"
            />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-purple-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                    )}>
                      {format(message.timestamp, 'h:mm a')}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 space-y-2">
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

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t-2 border-black">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about recruitment..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
    </>
  );
};

export default FloatingChatBot;
