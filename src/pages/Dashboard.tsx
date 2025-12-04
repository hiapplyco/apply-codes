import {
  MessageSquare,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Users,
  Book,
  Search,
  User,
  UserSearch
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const navigate = useNavigate();

  const toolCards = [
    {
      title: "Sourcing",
      description: "Find candidates with AI-powered searches",
      icon: Search,
      path: "/sourcing",
      gradient: "from-purple-500 to-violet-600",
      isPrimary: true
    },
    {
      title: "Enrichment",
      description: "Look up contact info by LinkedIn or email",
      icon: UserSearch,
      path: "/enrichment",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      title: "Create Content",
      description: "Job posts, emails, and more",
      icon: PlusCircle,
      path: "/content-creation",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Meeting",
      description: "AI-assisted video interviews",
      icon: Users,
      path: "/meeting",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Chat Assistant",
      description: "Your AI recruiting copilot",
      icon: MessageSquare,
      path: "/chat",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Documentation",
      description: "Guides, MCP setup & integrations",
      icon: Book,
      path: "/documentation",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      title: "Profile & History",
      description: "Settings, searches, and projects",
      icon: User,
      path: "/profile",
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <TooltipProvider>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Compact Hero Section */}
          <div className="mb-6 text-center">
            <img
              src="/assets/apply-logo.svg"
              alt="Apply Logo"
              className="h-12 object-contain mx-auto mb-3"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              AI-Powered Talent Acquisition
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Find and attract exceptional talent with AI agents
            </p>
          </div>

          {/* Compact Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {toolCards.map((tool) => (
              <Tooltip key={tool.title}>
                <TooltipTrigger asChild>
                  <Card
                    className="group relative h-full flex flex-col overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
                    onClick={() => {
                      if (tool.path) {
                        navigate(tool.path);
                      }
                    }}
                  >
                    {/* Icon */}
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <tool.icon className="h-4 w-4 text-gray-600" />
                    </div>

                    <CardHeader className="p-3 pr-10">
                      <CardTitle className="text-sm font-bold text-gray-900 group-hover:text-[#8B5CF6] transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-600 mt-1">
                        {tool.description}
                      </CardDescription>

                      {/* Action */}
                      <div className="mt-2">
                        <span className="text-xs text-[#8B5CF6] font-medium group-hover:translate-x-1 inline-flex items-center transition-all">
                          Open
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tool.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Compact CTA Section */}
          <div className="mt-6 text-center">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-4 border border-purple-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Start Building Your Talent Pipeline
              </h2>
              <p className="text-sm text-gray-700 mb-3">
                Join thousands using Apply's AI approach to find top talent
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate("/sourcing")}
                  className="bg-[#8B5CF6] hover:bg-[#9b87f5] text-white px-4 py-2 text-sm shadow"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Start Sourcing
                </Button>
                <Button
                  onClick={() => navigate("/profile")}
                  variant="outline"
                  className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <User className="w-4 h-4 mr-1" />
                  My Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;
