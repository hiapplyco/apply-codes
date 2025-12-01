import {
  FileSearch,
  Video,
  MessageSquare,
  PlusCircle,
  Briefcase,
  ArrowRight,
  Clock,
  Sparkles,
  Bot,
  Users,
  Link2,
  Terminal,
  Settings
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { MCPInstructionsModal } from "@/components/dashboard/MCPInstructionsModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showMCPModal, setShowMCPModal] = useState(false);

  const toolCards = [
    {
      title: "Sourcing Assistant",
      description: "AI-powered boolean searches across platforms",
      icon: FileSearch,
      path: "/sourcing",
      gradient: "from-blue-500 to-cyan-500",
      isPrimary: true
    },
    {
      title: "Search History",
      description: "View saved candidates and projects",
      icon: Clock,
      path: "/search-history",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      title: "Meeting Room",
      description: "AI-assisted interviews and calls",
      icon: Users,
      path: "/meeting",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Chat Assistant",
      description: "Your AI recruitment copilot",
      icon: MessageSquare,
      path: "/chat",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Post a Job",
      description: "Create optimized job postings",
      icon: Briefcase,
      path: "/job-post",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "Content Creation",
      description: "Generate LinkedIn posts",
      icon: PlusCircle,
      path: "/linkedin-post",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      title: "Integrations",
      description: "Connect 20+ platforms",
      icon: Link2,
      path: "/documentation",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      title: "MCP Tools",
      description: "Enable Claude Desktop integration",
      icon: Terminal,
      action: () => setShowMCPModal(true),
      gradient: "from-gray-600 to-gray-800"
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
                    className={`group relative h-full flex flex-col overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer bg-white ${tool.disabled ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    onClick={() => {
                      if (tool.action) {
                        tool.action();
                      } else if (!tool.disabled && tool.path) {
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
                          {tool.disabled ? 'Coming Soon' : 'Open'}
                          {!tool.disabled && <ArrowRight className="ml-1 h-3 w-3" />}
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
                  onClick={() => navigate("/search-history")}
                  variant="outline"
                  className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  View History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MCP Instructions Modal */}
      <MCPInstructionsModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
      />
    </TooltipProvider>
  );
};

export default Dashboard;
