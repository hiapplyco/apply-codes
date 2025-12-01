import { useState, useEffect, useRef } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { chatAssistant } from "@/lib/firebase/functions/chatAssistant";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "firebase/firestore";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Folder
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { StandardProjectContext } from '@/components/project/StandardProjectContext';
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { useProjectContext } from "@/context/ProjectContext";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    searchCount?: number;
    projectCount?: number;
    candidateCount?: number;
  };
}

interface UserContext {
  totalSearches: number;
  totalProjects: number;
  totalCandidates: number;
  recentSearches: Array<{
    id: string;
    search_query: string;
    boolean_query: string;
    created_at: string;
    results_count: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    candidates_count: number;
  }>;
}

const Chat = () => {
  const { user } = useNewAuth();
  const { selectedProjectId, selectedProject } = useProjectContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [showProjectContext, setShowProjectContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Context integration for chat
  const { processContent } = useContextIntegration({
    context: 'chat'
  });

  useEffect(() => {
    if (user) {
      fetchUserContext();
      initializeChat();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserContext = async () => {
    try {
      if (!user || !db) return;

      const searchQuery = query(
        collection(db, "users", user.uid, "searchHistory"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const searchSnapshot = await getDocs(searchQuery);
      const searches = searchSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      const projectsQuery = query(
        collection(db, "projects"),
        where("ownerId", "==", user.uid),
        where("isArchived", "==", false)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      const candidatesSnapshot = await getDocs(collection(db, "users", user.uid, "savedCandidates"));

      setUserContext({
        totalSearches: searches.length,
        totalProjects: projects.length,
        totalCandidates: candidatesSnapshot.size,
        recentSearches: searches.map(search => ({
          ...search,
          created_at: search.createdAt || search.created_at || new Date().toISOString(),
          results_count: search.results_count || 0,
          search_query: search.search_query || '',
          boolean_query: search.boolean_query || ''
        })),
        projects: projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          candidates_count: project.candidatesCount || project.candidates_count || 0
        }))
      });
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI recruitment assistant powered by Apply's agentic technology. I can help you with:

• Analyzing your search history and patterns
• Finding candidates across your projects
• Creating new boolean searches
• Providing recruitment insights and tips
• Answering questions about your saved candidates

What would you like to explore today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const generateSystemPrompt = () => {
    if (!userContext) return "";

    return `You are Apply's AI recruitment assistant. You have access to the user's recruitment data:

User Statistics:
- Total Searches: ${userContext.totalSearches}
- Total Projects: ${userContext.totalProjects}
- Total Saved Candidates: ${userContext.totalCandidates}

Recent Searches:
${userContext.recentSearches.map(search => `- "${search.search_query}" (${search.results_count} results)`).join('\n')}

Active Projects:
${userContext.projects.map(project => `- ${project.name}: ${project.candidates_count} candidates`).join('\n')}

Provide helpful, specific advice based on their data. Be conversational but professional. When suggesting searches, provide actual boolean strings they can use.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call our chat assistant function
      const data = await chatAssistant({
        message: input.trim(),
        systemPrompt: generateSystemPrompt(),
        history: messages.slice(-10).map(message => ({
          role: message.role,
          content: message.content
        })),
        projectId: selectedProjectId,
        userId: user?.uid
      });
      const error = null;

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Quick replies
  const quickReplies = [
    "Find candidates for my active project",
    "Analyze my recent search history",
    "Help me create a boolean string",
    "Draft a candidate outreach message"
  ];

  const handleQuickReply = (reply: string) => {
    setInput(reply);
    // Optional: auto-submit
    // handleSubmit({ preventDefault: () => {} } as any);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto relative">
      {/* Single Card containing everything */}
      <Card className="flex-1 min-h-0 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Compact Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
                <p className="text-[11px] text-gray-500">Powered by Apply</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Compact Project Indicator */}
              <button
                onClick={() => setShowProjectContext(!showProjectContext)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProject
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {selectedProject?.name || 'Add Context'}
                </span>
                {showProjectContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContext(!showContext)}
                className={`h-8 px-2 border-gray-300 ${showContext ? 'bg-purple-50 border-purple-200 text-purple-700' : ''}`}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Collapsible Project Context */}
          {showProjectContext && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <StandardProjectContext
                context="chat"
                title=""
                description=""
                onContentProcessed={async (content) => {
                  try {
                    await processContent(content);
                    const contextMessage: Message = {
                      id: `context-${Date.now()}`,
                      role: 'assistant',
                      content: `I've received your ${content.type} content. This will help me provide more relevant responses.`,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, contextMessage]);
                    toast.success(`${content.type} context added`);
                    setShowProjectContext(false);
                  } catch (error) {
                    console.error('Chat context processing error:', error);
                  }
                }}
                projectSelectorPlaceholder="Select project..."
                className="border-0 shadow-none p-0 mb-0"
              />
            </div>
          )}
        </div>

        {/* Messages Area - Takes remaining space */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                )}

                <div className={`flex flex-col gap-0.5 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.metadata && (
                      <div className="mt-2 pt-2 border-t border-gray-200/20 text-xs opacity-70">
                        {message.metadata.searchCount && <span>Searches: {message.metadata.searchCount} </span>}
                        {message.metadata.projectCount && <span>Projects: {message.metadata.projectCount}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">
                    {format(new Date(message.timestamp), 'h:mm a')}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200">
          {/* Quick Replies */}
          {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(reply)}
                  className="whitespace-nowrap px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about candidates, projects, or recruitment..."
              className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-sm py-2.5"
              rows={1}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-[44px] w-[44px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </Card>

      {/* Context Panel - Sliding Overlay */}
      {showContext && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l-2 border-black shadow-xl z-20 flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Your Data
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContext(false)}
              className="h-7 w-7 p-0 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3">
            {userContext ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-purple-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-purple-900">{userContext.totalSearches}</div>
                    <div className="text-[10px] text-purple-600">Searches</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-900">{userContext.totalProjects}</div>
                    <div className="text-[10px] text-blue-600">Projects</div>
                  </div>
                </div>

                {/* Recent Searches */}
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Recent Searches</h4>
                  <div className="space-y-1.5">
                    {userContext.recentSearches.slice(0, 4).map((search) => (
                      <div
                        key={search.id}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                        onClick={() => setInput(`Analyze: ${search.search_query}`)}
                      >
                        <p className="text-xs font-medium text-gray-900 truncate">{search.search_query}</p>
                        <p className="text-[10px] text-gray-500">{search.results_count} results</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Projects</h4>
                  <div className="space-y-1.5">
                    {userContext.projects.slice(0, 4).map((project) => (
                      <div
                        key={project.id}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                        onClick={() => setInput(`Find candidates for: ${project.name}`)}
                      >
                        <p className="text-xs font-medium text-gray-900 truncate">{project.name}</p>
                        <p className="text-[10px] text-gray-500">{project.candidates_count} candidates</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">Loading...</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default Chat;
