import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
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
      // Fetch user's search history
      const { data: searches, count: searchCount } = await supabase
        .from("search_history")
        .select("*", { count: "exact" })
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch user's projects
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      // Fetch total candidates
      const { count: candidateCount } = await supabase
        .from("saved_candidates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      setUserContext({
        totalSearches: searchCount || 0,
        totalProjects: projects?.length || 0,
        totalCandidates: candidateCount || 0,
        recentSearches: searches || [],
        projects: projects || []
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
      // Call our edge function
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: input.trim(),
          systemPrompt: generateSystemPrompt(),
          history: messages.slice(-10).map(message => ({
            role: message.role,
            content: message.content
          })),
          projectId: selectedProjectId,
          userId: user?.id
        }
      });

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
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-6xl mx-auto p-6">
      <div className="mb-6 flex-shrink-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-600" />
              AI Recruitment Assistant
            </h1>
            <p className="text-gray-600">
              Your intelligent copilot for recruitment insights and automation
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowContext(!showContext)}
          >
            <Info className="w-4 h-4 mr-2" />
            {showContext ? 'Hide' : 'Show'} Context
          </Button>
        </div>

        {/* Context Bar */}
        <ContextBar
          context="chat"
          title="Chat Context & Project"
          description="Select a project and add context to enhance your AI conversations"
          onContentProcessed={async (content) => {
            try {
              await processContent(content);
              setContextContent(content.text);
              
              // Add context message to chat
              const contextMessage: Message = {
                id: `context-${Date.now()}`,
                role: 'assistant',
                content: `📎 I've received and processed your ${content.type} content. This context will help me provide more relevant responses to your questions.`,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, contextMessage]);
              
              toast.success(`${content.type} context added to chat`);
            } catch (error) {
              console.error('Chat context processing error:', error);
            }
          }}
          projectSelectorProps={{
            placeholder: "Select a project (optional)",
            className: "w-64"
          }}
          showLabels={true}
          size="default"
          layout="horizontal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 min-h-0">
          <Card className="h-full flex flex-col border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
            <ScrollArea className="flex-1 p-6">
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
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
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

        {/* Context Panel */}
        <div className={`lg:col-span-1 min-h-0 ${showContext ? 'block' : 'hidden lg:block'}`}>
          <Card className="h-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] overflow-hidden">
            <CardContent className="p-6 h-full overflow-y-auto">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Your Context
              </h3>

              {userContext ? (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase">Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">Searches</span>
                        </div>
                        <Badge variant="secondary">{userContext.totalSearches}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Projects</span>
                        </div>
                        <Badge variant="secondary">{userContext.totalProjects}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Candidates</span>
                        </div>
                        <Badge variant="secondary">{userContext.totalCandidates}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-600 uppercase">Recent Searches</h4>
                    <div className="space-y-2">
                      {userContext.recentSearches.slice(0, 5).map((search) => (
                        <div key={search.id} className="text-sm p-2 bg-gray-50 rounded">
                          <p className="font-medium truncate">{search.search_query}</p>
                          <p className="text-xs text-gray-500">
                            {search.results_count} results • {format(new Date(search.created_at), 'MMM d')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  {userContext.projects.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-600 uppercase">Active Projects</h4>
                      <div className="space-y-2">
                        {userContext.projects.map((project) => (
                          <div key={project.id} className="text-sm p-2 bg-gray-50 rounded">
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-gray-500">
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
      </div>

      {/* Example Prompts */}
      <div className="mt-6 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Try asking:</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("What are my most successful search patterns?")}
            className="text-xs"
          >
            Analyze my search patterns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Help me create a boolean search for senior engineers")}
            className="text-xs"
          >
            Create boolean search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Which project has the most qualified candidates?")}
            className="text-xs"
          >
            Project insights
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Give me tips to improve my sourcing")}
            className="text-xs"
          >
            Sourcing tips
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;