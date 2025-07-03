
import { lazy, Suspense, memo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";

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

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Page header with project selector */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[#8B5CF6]">Candidate Sourcing</h1>
          <p className="text-gray-600 text-lg">
            Find qualified candidates, research companies, or discover talent at specific organizations
          </p>
        </div>
        
        {/* Global Project Selector */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Project (Optional)
            </label>
            <ProjectSelector 
              onProjectChange={setSelectedProjectId}
              className="w-full max-w-md"
              placeholder="Choose a project to save candidates to..."
            />
            {selectedProjectId && (
              <p className="text-sm text-gray-500">
                All saved candidates will be added to the selected project
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <Suspense fallback={<LoadingState />}>
        <MinimalSearchForm 
          userId={session?.user?.id ?? null}
          selectedProjectId={selectedProjectId}
        />
      </Suspense>
    </div>
  );
};

// Memo the component to prevent unnecessary re-renders
const Sourcing = memo(SourcingComponent);
export default Sourcing;
