
import { memo, useState, useEffect, useCallback } from "react";
import { SearchForm } from "./search/SearchForm";
import { useLocation } from "react-router-dom";
import { useAgentOutputs } from "@/stores/useAgentOutputs";
import { useClientAgentOutputs } from "@/stores/useClientAgentOutputs";
import { StructuredSearchResults } from "./search/StructuredSearchResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgentProcessor } from "./search/AgentProcessor";
import { GenerateAnalysisButton } from "./search/analysis/GenerateAnalysisButton";
import { AnalysisReport } from "./search/analysis/AnalysisReport";
import { useSearchForm } from "./search/hooks/useSearchForm";

interface NewSearchFormProps {
  userId: string | null;
  autoRun?: boolean;
  initialRequirements?: string;
  initialJobId?: number | null;
  initialSearchString?: string;
  jobTitle?: string;
}

const NewSearchForm = ({ 
  userId, 
  autoRun = false,
  initialRequirements,
  initialJobId,
  initialSearchString,
  jobTitle
}: NewSearchFormProps) => {
  // Debug logging
  console.log('NewSearchForm - Props received:', {
    userId,
    autoRun,
    initialRequirements: !!initialRequirements,
    initialJobId,
    initialSearchString: !!initialSearchString,
    jobTitle
  });
  const location = useLocation();
  const [currentJobId, setCurrentJobId] = useState<number | null>(initialJobId || null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(!!initialSearchString);

  const handleJobCreatedOrSubmitted = (jobId: number, submittedText: string) => {
    console.log("Job created/submitted:", { jobId, submittedText });

    if (currentJobId !== jobId) {
        setIsProcessingComplete(false);
        setIsGeneratingAnalysis(false);
        setShowGoogleSearch(false);
        setOutput(jobId, null);
    }

    setCurrentJobId(jobId);
    setIsProcessingComplete(true);
  };

  const {
    searchText,
    setSearchText,
    isProcessing,
    searchString,
    setSearchString,
  } = useSearchForm(userId, handleJobCreatedOrSubmitted, currentJobId);

  const { data: agentOutput, isLoading: isLoadingAgentOutput } = useAgentOutputs(currentJobId || 0);
  const { setOutput } = useClientAgentOutputs();

  const handleProcessingComplete = () => {
    console.log("Agent processing complete");
    setIsProcessingComplete(true);
    setIsGeneratingAnalysis(false);
  };

  useEffect(() => {
    const state = location.state as { content?: string; autoRun?: boolean; searchString?: string } | null;
    
    // Use props first, then location state
    if (initialRequirements) {
      setSearchText(initialRequirements);
    } else if (state?.content) {
      setSearchText(state.content);
    }
    
    if (initialSearchString) {
      setSearchString(initialSearchString);
      setShowGoogleSearch(true);
    } else if (state?.searchString) {
      setSearchString(state.searchString);
      setShowGoogleSearch(true);
    }
    
    if (state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setSearchText, setSearchString, initialRequirements, initialSearchString]);

  useEffect(() => {
    if ((autoRun || (location.state as { autoRun?: boolean })?.autoRun) && searchText && currentJobId && !isProcessing && !isGeneratingAnalysis) {
       console.log("Auto-running analysis generation...");
       handleGenerateAnalysis();
       if (location.state) {
         window.history.replaceState({}, document.title);
       }
    }
  }, [autoRun, searchText, location.state, isProcessing, isGeneratingAnalysis, currentJobId, handleGenerateAnalysis]);
  
  // Auto-show Google search if we have initialSearchString and autoRun
  useEffect(() => {
    if (autoRun && initialSearchString && !showGoogleSearch) {
      console.log("Auto-showing Google search with initial search string");
      setShowGoogleSearch(true);
      setIsProcessingComplete(true);
    }
  }, [autoRun, initialSearchString, showGoogleSearch]);

  useEffect(() => {
    if (agentOutput && !isLoadingAgentOutput) {
      console.log("Agent output received:", agentOutput);
      setIsProcessingComplete(true);

      if (agentOutput.searchString) {
        setSearchString(agentOutput.searchString);
      } else if (agentOutput.job_id) {
        const fetchJobSearchString = async () => {
          console.log("Fetching search string for job:", agentOutput.job_id);
          try {
            const { data, error } = await supabase
              .from('jobs')
              .select('search_string')
              .eq('id', agentOutput.job_id)
              .single();

            if (error) throw error;

            if (data?.search_string) {
              setSearchString(data.search_string);
            } else {
              console.log("No search string found in job record.");
            }
          } catch (error) {
            console.error("Error fetching job search string:", error);
          }
        };
        fetchJobSearchString();
      }
    }
  }, [agentOutput, isLoadingAgentOutput, setSearchString]);

  const handleGenerateAnalysis = useCallback(() => {
      if (!searchText || !currentJobId) {
          toast.error("Cannot generate analysis without requirements and a job ID.");
          return;
      }
      console.log("Triggering analysis generation for job:", currentJobId);
      setIsGeneratingAnalysis(true);
      setIsProcessingComplete(false);
  }, [searchText, currentJobId]);

  const handleShowGoogleSearch = (generatedSearchString: string) => {
    if (!generatedSearchString || generatedSearchString.trim() === '') {
      toast.error("Cannot search with empty search string");
      return;
    }
    console.log("Showing Google Search for:", generatedSearchString);
    const finalSearchString = generatedSearchString.includes("site:linkedin.com/in/")
      ? generatedSearchString
      : `${generatedSearchString} site:linkedin.com/in/`;

    setSearchString(finalSearchString);
    setShowGoogleSearch(true);
  };

  return (
    <div className="space-y-6">
      <SearchForm
        userId={userId}
        onJobCreated={handleJobCreatedOrSubmitted}
        currentJobId={currentJobId}
        isProcessingComplete={isProcessingComplete}
        onShowGoogleSearch={handleShowGoogleSearch}
      />

      {currentJobId && (
        <AnalysisReport
          agentOutput={agentOutput}
          isGeneratingAnalysis={isGeneratingAnalysis}
          isProcessingComplete={isProcessingComplete}
          jobId={currentJobId}
        >
          {isGeneratingAnalysis && !isProcessingComplete && (
            <AgentProcessor
              content={searchText}
              jobId={currentJobId}
              onComplete={handleProcessingComplete}
            />
          )}
          {!isGeneratingAnalysis && currentJobId && !agentOutput && (
             <GenerateAnalysisButton onClick={handleGenerateAnalysis} />
          )}
           {isLoadingAgentOutput && <p>Loading analysis data...</p>}
        </AnalysisReport>
      )}

       {showGoogleSearch && searchString && (
         <div className="mt-6">
           <StructuredSearchResults
             searchString={searchString}
             jobId={currentJobId || undefined}
             searchType="candidates"
           />
         </div>
       )}
    </div>
  );
};

export default memo(NewSearchForm);
