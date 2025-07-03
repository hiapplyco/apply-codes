
import { lazy, Suspense, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Minimal stable search form 
const MinimalSearchForm = lazy(() => import("@/components/MinimalSearchForm"));

const LoadingState = () => (
  <div className="h-96 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
  </div>
);

const SourcingComponent = () => {
  const { session, isAuthenticated, isLoading } = useAuth();

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
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[#8B5CF6]">Candidate Sourcing</h1>
        <p className="text-gray-600 text-lg">
          Find qualified candidates, research companies, or discover talent at specific organizations
        </p>
      </div>

      {/* Main content */}
      <Suspense fallback={<LoadingState />}>
        <MinimalSearchForm 
          userId={session?.user?.id ?? null}
        />
      </Suspense>
    </div>
  );
};

// Memo the component to prevent unnecessary re-renders
const Sourcing = memo(SourcingComponent);
export default Sourcing;
