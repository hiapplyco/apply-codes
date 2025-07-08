
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processJobRequirements } from "@/utils/jobRequirements";
import { SearchType } from "../types";
import { generateSummary } from "./utils/generateSummary";
import { createJob } from "./utils/createJob";
import { useProjectContext } from "@/context/ProjectContext";
import { trackBooleanGeneration, trackEvent } from "@/lib/analytics";

/**
 * Hook for handling search form submission
 */
export const useSearchFormSubmitter = (
  userId: string | null,
  onJobCreated: (jobId: number, searchText: string, data?: any) => void,
  source: 'default' | 'clarvida' = 'default',
  onSubmitStart?: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { selectedProjectId } = useProjectContext();
  
  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    searchText: string,
    searchType: SearchType,
    companyName: string
  ) => {
    e.preventDefault();
    
    if (!searchText?.trim()) {
      toast.error("Please enter some content before submitting");
      return;
    }

    if (searchType === "candidates-at-company" && !companyName?.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    // For Clarvida source, check if user is authenticated
    if (source === 'clarvida' && !userId) {
      toast.error("Please sign in to use Clarvida");
      return;
    }

    if (onSubmitStart) {
      onSubmitStart();
    }
    
    setIsProcessing(true);

    try {
      console.log(`Processing form submission for source: ${source}`);
      
      // Generate title and summary
      const { title, summary } = await generateSummary(searchText);
      
      // Create job in database
      const jobId = await createJob(searchText, userId, title, summary, source);
      
      console.log(`Calling processJobRequirements with source: ${source}, projectId: ${selectedProjectId}`);
      const result = await processJobRequirements(searchText, searchType, companyName, userId, source, selectedProjectId);
      
      if (source === 'clarvida') {
        // For Clarvida, pass the data directly to the callback
        if (!result || !result.data) {
          throw new Error('Failed to generate Clarvida report: No data returned');
        }
        onJobCreated(jobId, searchText, result.data);
        toast.success("Analysis complete!");
        trackEvent('Clarvida Analysis', { success: 1 });
      } else {
        // For the regular search flow
        if (!result?.searchString) {
          throw new Error('Failed to generate search string');
        }

        // Update job with search string
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ search_string: result.searchString })
          .eq('id', jobId);

        if (updateError) throw updateError;

        onJobCreated(jobId, searchText);
        toast.success("Search string generated successfully!");
        trackBooleanGeneration(searchText, true);
        trackEvent('Boolean Generation', { 
          searchType,
          inputLength: searchText.length,
          hasCompany: searchType === 'candidates-at-company' ? 1 : 0
        });
      }

    } catch (error) {
      console.error('Error processing content:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process content. Please try again.");
      
      // Track failures
      if (source === 'clarvida') {
        trackEvent('Clarvida Analysis', { success: 0 });
      } else {
        trackBooleanGeneration(searchText, false);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [userId, onJobCreated, source, onSubmitStart, selectedProjectId]);

  return {
    isProcessing,
    setIsProcessing,
    handleSubmit
  };
};
