
import { useState } from "react";
import { toast } from "sonner";
import { processJobRequirements } from "@/utils/jobRequirements";
import { SearchType } from "../types";
import { generateSummary } from "./utils/generateSummary";
import { createJob } from "./utils/createJob";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const useFormSubmit = (
  userId: string | null,
  onJobCreated: (jobId: number, searchText: string, data?: any) => void,
  source: 'default' | 'clarvida' = 'default'
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScrapingProfiles, setIsScrapingProfiles] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent,
    searchText: string,
    searchType: SearchType,
    companyName: string
  ) => {
    event.preventDefault();
    setIsProcessing(true);

    try {
      console.log(`Processing form submission for source: ${source}`);
      
      // Generate title and summary
      const { title, summary } = await generateSummary(searchText);
      
      // Create job in database
      const jobId = await createJob(searchText, userId, title, summary, source);
      console.log(`Created job with ID: ${jobId}`);
      
      // Process content based on search type and source
      console.log(`Calling processJobRequirements with source: ${source}`);
      const result = await processJobRequirements(searchText, searchType, companyName, userId, source);
      console.log('Received result from processJobRequirements:', result);
      
      if (source === 'clarvida') {
        // For Clarvida, pass the data directly to the callback
        if (!result || !result.data) {
          throw new Error('Failed to generate Clarvida report: No data returned');
        }
        
        onJobCreated(jobId, searchText, result.data);
        return result.data;
      } else {
        // For the regular search flow
        if (!result?.searchString) {
          throw new Error('Failed to generate search string');
        }

        // Update job with search string
        try {
          if (!db) {
            throw new Error('Firestore not initialized');
          }

          const jobRef = doc(db, 'jobs', String(jobId));
          await updateDoc(jobRef, { search_string: result.searchString });
        } catch (updateError) {
          console.error('Failed to update job with search string:', updateError);
          // Continue anyway - don't block the user experience for database issues
        }

        onJobCreated(jobId, searchText);
        toast.success("Search string generated successfully!");
        return result.searchString;
      }

    } catch (error) {
      console.error('Error processing content:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process content. Please try again.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    setIsProcessing,
    isScrapingProfiles,
    setIsScrapingProfiles,
    handleSubmit
  };
};
