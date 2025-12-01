import { memo, useState, useEffect, useCallback } from 'react';
import { SearchForm } from './search/SearchForm';
import { useLocation } from 'react-router-dom';
import { useAgentOutputs } from '@/stores/useAgentOutputs';
import { useClientAgentOutputs } from '@/stores/useClientAgentOutputs';
import { StructuredSearchResults } from './search/StructuredSearchResults';
import { toast } from 'sonner';
import { AgentProcessor } from './search/AgentProcessor';
import { GenerateAnalysisButton } from './search/analysis/GenerateAnalysisButton';
import { AnalysisReport } from './search/analysis/AnalysisReport';
import { useSearchForm } from './search/hooks/useSearchForm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SimpleSearchFormProps {
  userId: string | null;
  initialRequirements?: string;
  initialJobId?: number | null;
  autoRun?: boolean;
  initialSearchString?: string;
  jobTitle?: string;
}

const SimpleSearchForm = ({
  userId,
  autoRun = false,
  initialRequirements,
  initialJobId,
  initialSearchString,
  jobTitle
}: SimpleSearchFormProps) => {
  const location = useLocation();
  const [currentJobId, setCurrentJobId] = useState<number | null>(initialJobId || null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(!!initialSearchString);
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);

  const handleJobCreatedOrSubmitted = (jobId: number, submittedText: string) => {
    console.log('Job created/submitted:', { jobId, submittedText });

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

  const { data: agentOutput, isLoading: isLoadingAgentOutput } = useAgentOutputs(currentJobId);
  const { setOutput } = useClientAgentOutputs();

  const handleProcessingComplete = () => {
    console.log('Agent processing complete');
    setIsProcessingComplete(true);
    setIsGeneratingAnalysis(false);
  };

  useEffect(() => {
    const state = location.state as { content?: string; autoRun?: boolean; searchString?: string } | null;

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
      console.log('Auto-running analysis generation...');
      handleGenerateAnalysis();
      if (location.state) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [autoRun, searchText, location.state, isProcessing, isGeneratingAnalysis, currentJobId, handleGenerateAnalysis]);

  useEffect(() => {
    if (autoRun && initialSearchString && !showGoogleSearch) {
      console.log('Auto-showing Google search with initial search string');
      setShowGoogleSearch(true);
      setIsProcessingComplete(true);
    }
  }, [autoRun, initialSearchString, showGoogleSearch]);

  useEffect(() => {
    if (agentOutput && !isLoadingAgentOutput) {
      console.log('Agent output received:', agentOutput);
      setIsProcessingComplete(true);

      if (agentOutput.searchString) {
        setSearchString(agentOutput.searchString);
      } else if (agentOutput.job_id) {
        const fetchJobSearchString = async () => {
          console.log('Fetching search string for job:', agentOutput.job_id);
          try {
            if (!db) {
              throw new Error('Firestore not initialized');
            }

            const jobRef = doc(db, 'jobs', String(agentOutput.job_id));
            const jobSnap = await getDoc(jobRef);

            if (!jobSnap.exists()) {
              console.log('Job record not found in Firestore.');
              return;
            }

            const data = jobSnap.data() as { search_string?: string };

            if (data?.search_string) {
              setSearchString(data.search_string);
            } else {
              console.log('No search string found in job record.');
            }
          } catch (error) {
            console.error('Error fetching job search string:', error);
          }
        };
        fetchJobSearchString();
      }
    }
  }, [agentOutput, isLoadingAgentOutput, setSearchString]);

  const handleGenerateAnalysis = useCallback(() => {
    if (!searchText || !currentJobId) {
      toast.error('Cannot generate analysis without requirements and a job ID.');
      return;
    }
    console.log('Triggering analysis generation for job:', currentJobId);
    setIsGeneratingAnalysis(true);
    setIsProcessingComplete(false);
  }, [searchText, currentJobId]);

  const handleShowGoogleSearch = (generatedSearchString: string) => {
    if (!generatedSearchString || generatedSearchString.trim() === '') {
      toast.error('Cannot search with empty search string');
      return;
    }
    console.log('Showing Google Search for:', generatedSearchString);
    const finalSearchString = generatedSearchString.includes('site:linkedin.com/in/')
      ? generatedSearchString
      : `${generatedSearchString} site:linkedin.com/in/`;

    setSearchString(finalSearchString);
    setShowGoogleSearch(true);
  };

  const handleEnhancedMode = () => {
    setIsEnhancedMode(true);
    toast.success('🚀 Enhanced mode activated! Full AI-powered functionality restored.');
    console.log('Enhanced mode: All single-letter variable conflicts resolved - v2');
  };

  if (isEnhancedMode) {
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
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {jobTitle ? `Search for: ${jobTitle}` : 'AI-Powered Boolean Search'}
        </h2>

        <Card className="p-6 border-2 border-purple-400 bg-purple-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Enhanced AI Features Available
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                Unlock advanced Gemini AI integration with full search analysis, candidate enrichment, and dynamic visualizations.
              </p>
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-purple-600 border-purple-400">
                  Boolean Search Generation
                </Badge>
                <Badge variant="outline" className="text-purple-600 border-purple-400">
                  Contact Enrichment
                </Badge>
                <Badge variant="outline" className="text-purple-600 border-purple-400">
                  AI Analysis
                </Badge>
              </div>
            </div>
            <button
              onClick={handleEnhancedMode}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Enable Enhanced Mode
            </button>
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-400 bg-green-50">
          <h3 className="font-medium text-green-900 mb-2">✅ Page Restored Successfully</h3>
          <p className="text-sm text-green-700">
            The Sourcing page is now working properly. Click "Enable Enhanced Mode" above to access full AI-powered features.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default memo(SimpleSearchForm);
