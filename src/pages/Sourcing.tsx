import { lazy, Suspense, memo } from "react";
import { useNewAuth } from "@/context/NewAuthContext";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { type ContextBarProps } from "@/components/context/ContextBar";
import { StandardProjectContext } from '@/components/project/StandardProjectContext';
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { useProjectContext } from "@/context/ProjectContext";
import { toast } from "sonner";

// Minimal stable search form 
const MinimalSearchForm = lazy(() => import("@/components/MinimalSearchForm"));

const LoadingState = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner size="lg" text="Loading sourcing data..." />
  </div>
);

const SourcingComponent = () => {
  const { user, isLoading, isAuthenticated } = useNewAuth();
  const { selectedProjectId } = useProjectContext();

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
      <StandardProjectContext
        context="sourcing"
        onContentProcessed={handleContextContent}
        enabledButtons={{
          upload: true,
          firecrawl: true,
          perplexity: true,
          location: true
        }}
      />

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
