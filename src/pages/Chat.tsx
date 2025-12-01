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
  Search,
  Folder,
  Users,
  Sparkles,
  X
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
  const { selectedProjectId } = useProjectContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showContext, setShowContext] = useState(false);
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
    <div className="flex flex-col h-full max-w-5xl mx-auto gap-3 relative">
      {/* Header & Context Section */}
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-xs text-gray-500">Powered by Apply Agentic Intelligence</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContext(!showContext)}
            className={`gap-2 ${showContext ? 'bg-purple-50 border-purple-200 text-purple-700' : ''}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Context</span>
          </Button>
        </div>

        <StandardProjectContext
          context="chat"
          title="Project Context"
          description="Select a project to give the AI specific context"
          onContentProcessed={async (content) => {
            try {
              await processContent(content);
              const contextMessage: Message = {
                id: `context-${Date.now()}`,
                role: 'assistant',
                content: `📎 I've received and processed your ${content.type} content. This context will help me provide more relevant responses.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, contextMessage]);
              toast.success(`${content.type} context added`);
            } catch (error) {
              console.error('Chat context processing error:', error);
            }
          }}
          projectSelectorPlaceholder="Select active project..."
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>

      <div className="flex gap-4 flex-1 min-h-0 relative">
        {/* Main Chat Area */}
        <Card className="flex-1 min-h-0 flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white z-10">
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {message.role === 'user' && (
                      <span className="text-[10px] text-gray-400 font-medium mr-1">You</span>
                    )}
                    {message.role === 'assistant' && (
                      <span className="text-[10px] text-gray-400 font-medium ml-1">AI Assistant</span>
                    )}

                    <div
                      className={`rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-200/20 text-xs opacity-70">
                          {message.metadata.searchCount && <span>Searches: {message.metadata.searchCount} • </span>}
                          {message.metadata.projectCount && <span>Projects: {message.metadata.projectCount}</span>}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-300 px-1">
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />

              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Quick Replies */}
              {messages.length < 3 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickReply(reply)}
                      className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about candidates, projects, or recruitment strategies..."
                    className="min-h-[50px] max-h-[150px] pr-12 resize-none rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white shadow-sm py-3"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-[50px] w-[50px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
              <div className="text-center">
                <p className="text-[10px] text-gray-400">
                  AI can make mistakes. Please verify important information.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Context Panel - Sliding Overlay */}
        {showContext && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l-2 border-black shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Context Data
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContext(false)}
                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {userContext ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-xs text-purple-600 font-medium mb-1">Searches</div>
                      <div className="text-xl font-bold text-purple-900">{userContext.totalSearches}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Projects</div>
                      <div className="text-xl font-bold text-blue-900">{userContext.totalProjects}</div>
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Searches</h4>
                    <div className="space-y-2">
                      {userContext.recentSearches.slice(0, 5).map((search) => (
                        <div key={search.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer" onClick={() => setInput(`Analyze search: ${search.search_query}`)}>
                          <p className="text-sm font-medium text-gray-900 truncate">{search.search_query}</p>
                          <p className="text-xs text-gray-500 mt-1">{search.results_count} results • {format(new Date(search.created_at), 'MMM d')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Projects */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Projects</h4>
                    <div className="space-y-2">
                      {userContext.projects.slice(0, 5).map((project) => (
                        <div key={project.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer" onClick={() => setInput(`Find candidates for project: ${project.name}`)}>
                          <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{project.candidates_count} candidates</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Loading context...</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
