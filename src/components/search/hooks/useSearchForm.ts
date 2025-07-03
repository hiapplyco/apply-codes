import { useCallback } from "react";
import { useSearchFormState } from "./useSearchFormState";
import { useSearchStringFetcher } from "./useSearchStringFetcher";
import { useFileUploadHandler } from "./useFileUploadHandler";
import { useSearchFormSubmitter } from "./useSearchFormSubmitter";
import { SearchType } from "../types"; // Keep type import

export const useSearchForm = (
  userId: string | null,
  onJobCreated: (jobId: number, searchText: string, data?: any) => void,
  currentJobId: number | null,
  source: 'default' | 'clarvida' = 'default',
  onSubmitStart?: () => void
) => {
  // Use the form state hook
  const {
    searchText,
    setSearchText,
    companyName,
    setCompanyName,
    searchType,
    setSearchType,
    searchString,
    setSearchString // Get the state setter for searchString
  } = useSearchFormState();

  // Use the search string fetcher hook - This looks correct
  useSearchStringFetcher(currentJobId, setSearchString);

  // Use the form submission hook
  const {
    isProcessing,
    setIsProcessing, // Expose setIsProcessing if needed externally
    handleSubmit: submitForm
  } = useSearchFormSubmitter(userId, onJobCreated, source, onSubmitStart);

  // Use the file upload hook
  const handleFileUpload = useFileUploadHandler(userId, setSearchText, setIsProcessing);

  // Create a wrapper for the submit form function to pass current state
  const handleSubmit = useCallback((event: React.FormEvent) => {
    // Pass the necessary state values from useSearchFormState to the submitter logic
    return submitForm(event, searchText, searchType, companyName);
  }, [submitForm, searchText, searchType, companyName]);

  // Return all the state and handlers needed by the component
  return {
    searchText,
    setSearchText,
    companyName,
    setCompanyName,
    isProcessing,
    searchType,
    setSearchType,
    searchString,
    setSearchString, // Include setSearchString if needed externally
    handleSubmit,
    handleFileUpload
  };
};
