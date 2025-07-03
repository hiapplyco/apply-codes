
import { lazy, Suspense, memo, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAgentOutputs } from "@/stores/useAgentOutputs";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { UploadRequirementsButton } from "@/components/url-scraper";
import { supabase } from "@/integrations/supabase/client";

// Temporary simple search form to avoid minification issues
const SimpleSearchForm = lazy(() => import("@/components/SimpleSearchForm"));

const LoadingState = () => (
  <div className="h-96 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
  </div>
);

const SourcingComponent = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [jobData, setJobData] = useState<{ content?: string; search_string?: string; title?: string } | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  
  
  // Check both location state and URL params for jobId
  const jobIdFromState = location.state?.jobId;
  const jobIdFromParams = searchParams.get('jobId');
  const jobId = jobIdFromState || (jobIdFromParams ? parseInt(jobIdFromParams) : null);
  
  // Check for autoSearch parameter
  const autoSearchFromParams = searchParams.get('autoSearch') === 'true';
  const autoRun = location.state?.autoRun || autoSearchFromParams;
  
  const processedRequirements = location.state?.processedRequirements;
  
  // Pre-fetch agent outputs if we have a jobId
  const { data: agentOutput } = useAgentOutputs(jobId);
  
  // Fetch job data if we have a jobId from URL params
  useEffect(() => {
    const fetchJobData = async () => {
      if (jobIdFromParams && !jobIdFromState) {
        setIsLoadingJob(true);
        try {
          const { data, error } = await supabase
            .from('jobs')
            .select('content, search_string, title')
            .eq('id', parseInt(jobIdFromParams))
            .single();
          
          if (error) {
            console.error('Error fetching job:', error);
          } else if (data) {
            setJobData(data);
          }
        } catch (error) {
          console.error('Error fetching job data:', error);
        } finally {
          setIsLoadingJob(false);
        }
      }
    };
    
    fetchJobData();
  }, [jobIdFromParams, jobIdFromState]);

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

      {/* Project selector */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <ProjectSelector 
          label="Select project for this search"
          placeholder="Choose a project (optional)"
          className="max-w-md"
        />
      </div>
      
      {/* Main content card */}
      <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] bg-white p-6">
        <Suspense fallback={<LoadingState />}>
          {isLoadingJob ? (
            <LoadingState />
          ) : (
            <SimpleSearchForm 
              userId={session?.user?.id ?? null}
              initialRequirements={processedRequirements || jobData?.content}
              initialJobId={jobId}
              autoRun={autoRun}
              initialSearchString={jobData?.search_string}
              jobTitle={jobData?.title}
            />
          )}
        </Suspense>
      </Card>
    </div>
  );
};

// Memo the component to prevent unnecessary re-renders
const Sourcing = memo(SourcingComponent);
export default Sourcing;
