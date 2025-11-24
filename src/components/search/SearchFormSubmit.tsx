
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { processJobRequirements } from "@/utils/jobRequirements";
import { SearchType } from "./types";
import { createJob } from "./hooks/utils/createJob";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface SearchFormSubmitProps {
  userId: string;
  searchText: string;
  searchType: SearchType;
  companyName: string;
  onJobCreated: (jobId: number, text: string) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

export const useSearchFormSubmit = ({
  userId,
  searchText,
  searchType,
  companyName,
  onJobCreated,
  onProcessingChange,
}: SearchFormSubmitProps) => {
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    onProcessingChange(true);

    try {
      const jobId = await createJob(searchText, userId, "Boolean Search", "", "default");
      if (!jobId) {
        throw new Error("Failed to create job record");
      }

      onJobCreated(jobId, searchText);

      const result = await processJobRequirements(searchText, searchType, companyName, userId);

      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const jobRef = doc(db, 'jobs', String(jobId));
      await updateDoc(jobRef, { search_string: result.searchString });

      toast({
        title: "Search generated",
        description: "Your search has been generated and opened in a new tab.",
      });
    } catch (error) {
      console.error('Error processing content:', error);
      toast({
        title: "Error",
        description: "Failed to process content. Please try again.",
        variant: "destructive",
      });
    } finally {
      onProcessingChange(false);
    }
  };

  return handleSubmit;
};
