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
  Info,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { ContextBar } from "@/components/context/ContextBar";
import { useContextIntegration } from "@/hooks/useContextIntegration";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contextContent, setContextContent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Context integration for chat
  const { processContent, isProcessing } = useContextIntegration({
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

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4">
      {/* Compact Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-600" />
            AI Assistant
          </h1>
          <div className="flex items-center gap-2">
            {/* Compact Context Bar */}
            <ContextBar
              context="chat"
              title=""
              description=""
              onContentProcessed={async (content) => {
                try {
                  await processContent(content);
                  setContextContent(content.text);
                  
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
              projectSelectorProps={{
                placeholder: "Project",
                className: "w-32"
              }}
              showLabels={false}
              size="sm"
              layout="horizontal"
              compact={true}
              className="border-none shadow-none bg-transparent"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContext(!showContext)}
              className="h-9"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main Chat Area - Now takes most space */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {format(message.timestamp, 'h:mm a')}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t-2 border-black">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your searches, projects, or candidates..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Compact Context Panel - Only shows when toggled */}
        {showContext && (
          <div className="w-80 min-h-0">
            <Card className="h-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] overflow-hidden">
              <CardContent className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Context
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContext(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

              {userContext ? (
                <div className="space-y-6">
                  {/* Compact Statistics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <Search className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Searches</div>
                      <div className="font-bold text-sm">{userContext.totalSearches}</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <Folder className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Projects</div>
                      <div className="font-bold text-sm">{userContext.totalProjects}</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <Users className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600">Candidates</div>
                      <div className="font-bold text-sm">{userContext.totalCandidates}</div>
                    </div>
                  </div>

                  {/* Compact Recent Searches */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-gray-600 uppercase">Recent Searches</h4>
                    <div className="space-y-1">
                      {userContext.recentSearches.slice(0, 3).map((search) => (
                        <div key={search.id} className="text-xs p-2 bg-gray-50 rounded">
                          <p className="font-medium truncate">{search.search_query}</p>
                          <p className="text-[10px] text-gray-500">
                            {search.results_count} results
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compact Projects */}
                  {userContext.projects.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-xs text-gray-600 uppercase">Projects</h4>
                      <div className="space-y-1">
                        {userContext.projects.slice(0, 3).map((project) => (
                          <div key={project.id} className="text-xs p-2 bg-gray-50 rounded">
                            <p className="font-medium truncate">{project.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {project.candidates_count} candidates
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>

      {/* Compact Example Prompts */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Try:</span>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("Analyze my search patterns")}
              className="text-xs h-7 px-2"
            >
              Analyze searches
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("Create boolean search")}
              className="text-xs h-7 px-2"
            >
              Boolean search
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("Project insights")}
              className="text-xs h-7 px-2"
            >
              Projects
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("Sourcing tips")}
              className="text-xs h-7 px-2"
            >
              Tips
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
