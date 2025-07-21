
import { lazy, Suspense, memo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { ContextBar } from "@/components/context/ContextBar";
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { toast } from "sonner";

// Minimal stable search form 
const MinimalSearchForm = lazy(() => import("@/components/MinimalSearchForm"));

const LoadingState = () => (
  <div className="h-96 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
  </div>
);

const SourcingComponent = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contextContent, setContextContent] = useState<string>('');
  
  const { processContent, isProcessing } = useContextIntegration({
    context: 'sourcing'
  });

  // Show loading while auth is being checked
  if (isLoading) {
    return <LoadingState />;
  }

  // Show debug info if not authenticated (this should not happen due to ProtectedRoute)
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Authentication issue detected. Session: {session ? 'exists' : 'missing'}</p>
          <p>Please try refreshing the page or logging in again.</p>
        </div>
      </div>
    );
  }

  const handleContextContent = async (content: any) => {
    try {
      await processContent(content);
      setContextContent(content.text);
      toast.success('Context content processed and ready for sourcing');
    } catch (error) {
      console.error('Context processing error:', error);
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Enhanced Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-3">Candidate Sourcing</h1>
          <p className="text-lg opacity-95 leading-relaxed">
            Find qualified candidates, research companies, or discover talent at specific organizations with AI-powered search
          </p>
        </div>
      </div>
      
      {/* Project & Context Selection */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <ContextBar
          context="sourcing"
          title="Project & Context"
          description="Select a project and add context through uploads, web scraping, or AI search"
          onContentProcessed={handleContextContent}
          projectSelectorProps={{
            placeholder: "Choose a project to save candidates to...",
            className: "w-full max-w-md"
          }}
          enabledButtons={{
            upload: true,
            firecrawl: true,
            perplexity: true,
            location: true
          }}
          showLabels={true}
          size="default"
        />
      </div>

      {/* Main content */}
      <Suspense fallback={<LoadingState />}>
        <MinimalSearchForm 
          userId={session?.user?.id ?? null}
          selectedProjectId={selectedProjectId}
          contextContent={contextContent}
        />
      </Suspense>
    </div>
  );
};

// Memo the component to prevent unnecessary re-renders
const Sourcing = memo(SourcingComponent);
export default Sourcing;
