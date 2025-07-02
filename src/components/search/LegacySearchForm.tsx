
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { processJobRequirements } from "@/utils/jobRequirements";
import { supabase } from "@/integrations/supabase/client";
import { SearchTypeToggle } from "@/components/search/SearchTypeToggle";
import { FormHeader } from "@/components/search/FormHeader";
import { ContentTextarea } from "@/components/search/ContentTextarea";
import { CompanyNameInput } from "@/components/search/CompanyNameInput";
import { SubmitButton } from "@/components/search/SubmitButton";
import { GoogleSearchWindow } from "@/components/search/GoogleSearchWindow";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SearchType } from "./types";
import { useFormState } from "./hooks/useFormState";
import { useFormSubmit } from "./hooks/useFormSubmit";
import { processFileUpload } from "./hooks/utils/processFileUpload";

interface SearchFormProps {
  userId: string | null;
  onJobCreated: (jobId: number, searchText?: string, data?: any) => void;
  currentJobId: number | null;
  isProcessingComplete: boolean;
  source?: 'default' | 'clarvida';
  hideSearchTypeToggle?: boolean;
  submitButtonText?: string;
}

export const LegacySearchForm = ({ 
  userId, 
  onJobCreated, 
  currentJobId,
  isProcessingComplete,
  source = 'default',
  hideSearchTypeToggle = false,
  submitButtonText,
}: SearchFormProps) => {
  const {
    isProcessing,
    setIsProcessing,
    isScrapingProfiles,
    handleSubmit: submitForm
  } = useFormSubmit(userId, onJobCreated, source);
  
  const {
    searchText,
    setSearchText,
    companyName,
    setCompanyName,
    searchType,
    setSearchType,
    searchString
  } = useFormState(currentJobId, (e, text, type, company) => 
    submitForm(e, text, type as SearchType, company)
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await processFileUpload(
      event.target.files?.[0],
      userId,
      setSearchText,
      setIsProcessing
    );
  };

  return (
    <Card className="p-6 border-4 border-black bg-[#FFFBF4] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <form onSubmit={(e) => submitForm(e, searchText, searchType as SearchType, companyName)} className="space-y-6">
        {!hideSearchTypeToggle && (
          <SearchTypeToggle 
            value={searchType as SearchType} 
            onValueChange={(value) => setSearchType(value)} 
          />
        )}
        
        <FormHeader />
        
        <ContentTextarea
          content={searchText}
          onChange={setSearchText}
        />

        {searchType === "candidates-at-company" && (
          <CompanyNameInput
            companyName={companyName}
            isProcessing={isProcessing}
            onChange={setCompanyName}
          />
        )}

        <div className="space-y-4">
          <SubmitButton 
            isProcessing={isProcessing || isScrapingProfiles}
            isDisabled={isProcessing || isScrapingProfiles || !searchText || (searchType === "candidates-at-company" && !companyName)}
            buttonText={submitButtonText}
          />
          
          {isScrapingProfiles && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scraping profiles from search results...</span>
            </div>
          )}
        </div>
      </form>

      {searchString && source !== 'clarvida' && (
        <div className="mt-6">
          <GoogleSearchWindow searchString={searchString} />
        </div>
      )}
    </Card>
  );
};

export default LegacySearchForm;
