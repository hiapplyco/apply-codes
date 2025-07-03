
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { processJobRequirements } from "@/utils/jobRequirements";
import { SearchType } from "./types";

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
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          content: searchText,
          user_id: userId
        })
        .select()
        .single();

      if (jobError) throw jobError;
      
      const jobId = jobData.id;
      onJobCreated(jobId, searchText);

      const result = await processJobRequirements(searchText, searchType, companyName, userId);

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ search_string: result.searchString })
        .eq('id', jobId);

      if (updateError) throw updateError;

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
