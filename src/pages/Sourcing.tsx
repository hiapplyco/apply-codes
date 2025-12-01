import { lazy, Suspense, memo, useState } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { type ContextBarProps } from "@/components/context/ContextBar";
import { StandardProjectContext } from '@/components/project/StandardProjectContext';
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { useProjectContext } from "@/context/ProjectContext";
import { toast } from "sonner";
import { Folder, ChevronDown, ChevronUp } from "lucide-react";

// Minimal stable search form 
const MinimalSearchForm = lazy(() => import("@/components/MinimalSearchForm"));

const LoadingState = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner size="lg" text="Loading sourcing data..." />
  </div>
);

const SourcingComponent = () => {
  const { user, isLoading, isAuthenticated } = useNewAuth();
  const { selectedProjectId, selectedProject } = useProjectContext();
  const [showContext, setShowContext] = useState(false);

  const { processContent } = useContextIntegration({
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
          <p>Authentication issue detected. User: {user ? 'exists' : 'missing'}</p>
          <p>Please try refreshing the page or logging in again.</p>
        </div>
      </div>
    );
  }

  const handleContextContent: NonNullable<ContextBarProps['onContentProcessed']> = async (content) => {
    try {
      await processContent(content);
    } catch (error) {
      console.error('Context processing error:', error);
      toast.error('Failed to process context content');
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      {/* Compact Header with Context Toggle */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Candidate Sourcing</h1>
            <p className="text-sm opacity-90 mt-1">
              AI-powered search for qualified candidates
            </p>
          </div>
          <button
            onClick={() => setShowContext(!showContext)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedProject
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[140px] truncate">
              {selectedProject?.name || 'Add Context'}
            </span>
            {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Context Section */}
        {showContext && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <StandardProjectContext
              context="sourcing"
              title=""
              description=""
              onContentProcessed={async (content) => {
                await handleContextContent(content);
                setShowContext(false);
              }}
              enabledButtons={{
                upload: true,
                firecrawl: true,
                perplexity: true,
                location: true
              }}
              className="bg-white/10 border-white/20 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Main content */}
      <Suspense fallback={<LoadingState />}>
        <MinimalSearchForm
          userId={user?.uid ?? null}
          selectedProjectId={selectedProjectId}
        />
      </Suspense>
    </div>
  );
};

// Memo the component to prevent unnecessary re-renders
const Sourcing = memo(SourcingComponent);
export default Sourcing;
