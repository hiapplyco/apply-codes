import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { SearchFormHeader } from "./SearchFormHeader";
import { useSearchForm } from "./hooks/useSearchForm";
import { SearchType, SearchFormProps } from "./types";
import { ChatStyleInput } from "./ChatStyleInput";
import { SearchTypeToggle } from "./SearchTypeToggle";
import { CompanyNameInput } from "./CompanyNameInput";
import { SubmitButton } from "./SubmitButton";
import { BooleanExplanation } from "./BooleanExplanation";
import { GeneratingAnimation } from "./GeneratingAnimation";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Search, Loader2, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UploadRequirementsButton } from "@/components/url-scraper";

export const SearchForm = ({
  userId,
  onJobCreated,
  currentJobId,
  isProcessingComplete = false,
  source = 'default',
  hideSearchTypeToggle = false,
  submitButtonText,
  onSubmitStart,
  onShowGoogleSearch // Prop to trigger showing Google Search results
}: SearchFormProps) => {
  const {
    searchText,
    setSearchText,
    companyName,
    setCompanyName,
    isProcessing,
    searchType,
    setSearchType,
    searchString, // The generated search string from the hook
    setSearchString, // Function to update the search string state in the hook
    handleSubmit,
    handleFileUpload // Use the file upload handler from the hook
  } = useSearchForm(userId, onJobCreated, currentJobId, source, onSubmitStart);

  const [isInputActive, setIsInputActive] = useState(false);
  const [showSearchString, setShowSearchString] = useState(false);
  const [isFindingProfiles, setIsFindingProfiles] = useState(false);
  const [booleanExplanation, setBooleanExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [animationStage, setAnimationStage] = useState<'generating' | 'explaining' | 'searching'>('generating');
  const [showAnimation, setShowAnimation] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    requirements: false,
    boolean: false
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Show search string when it's generated or when processing is complete
  useEffect(() => {
    // Show the search string section if a search string exists and processing isn't active
    if (searchString && !isProcessing) {
      setShowSearchString(true);
      // Explain the boolean when it's first generated or updated
      if (!isExplaining && !booleanExplanation) {
        explainBoolean(searchString);
      }
    }
  }, [searchString, isProcessing]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAnimation(true);
    setAnimationStage('generating');
    setBooleanExplanation(null); // Clear previous explanation
    
    await handleSubmit(e);
    
    // Wait a bit for the animation
    setTimeout(() => {
      setShowAnimation(false);
    }, 500);
  };
  
  const explainBoolean = async (booleanStr: string) => {
    setIsExplaining(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-boolean', {
        body: { booleanString: booleanStr, requirements: searchText }
      });
      
      if (error) throw error;
      if (data?.explanation) {
        setBooleanExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error explaining boolean:', error);
    } finally {
      setIsExplaining(false);
    }
  };
  
  const handleComplexityChange = async (complexity: 'simpler' | 'complex') => {
    if (!searchText || !searchString) return;
    
    setShowAnimation(true);
    setAnimationStage('generating');
    
    const modifiedText = `${searchText}\n\nPREVIOUS BOOLEAN: ${searchString}\n\nINSTRUCTION: Make this search ${complexity === 'simpler' ? 'simpler with fewer terms' : 'more comprehensive with additional terms and variations'}`;
    
    // Temporarily update searchText for regeneration
    const originalText = searchText;
    setSearchText(modifiedText);
    
    // Submit form to regenerate
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    
    // Restore original text
    setSearchText(originalText);
    
    // Explain new boolean
    if (searchString) {
      setAnimationStage('explaining');
      await explainBoolean(searchString);
    }
    
    setShowAnimation(false);
  };

  const handleCopySearchString = () => {
    if (!searchString) return; // Guard against copying empty string
    navigator.clipboard.writeText(searchString);
    toast.success("Search string copied to clipboard!");
  };

  const handleFindLinkedInProfiles = async () => {
    if (!searchString) {
      toast.error("No search string available. Please generate a search string first.");
      console.error("Find LinkedIn Profiles attempted without a search string");
      return;
    }

    console.log("Find LinkedIn Profiles button clicked with search string:", searchString);
    setIsFindingProfiles(true);
    setShowAnimation(true);
    setAnimationStage('searching');
    setHasSearched(true);
    setCollapsedSections({ requirements: true, boolean: true });

    try {
      if (onShowGoogleSearch) {
        console.log("Calling onShowGoogleSearch with search string");
        // Pass the generated search string to the parent component
        onShowGoogleSearch(searchString);
        toast.info("Finding LinkedIn profiles..."); // Use info level
      } else {
        console.error("Cannot show Google search: onShowGoogleSearch callback is missing");
        toast.error("Configuration error. Cannot initiate profile search.");
      }
    } catch (error) {
      console.error("Error triggering LinkedIn profile search:", error);
      toast.error("Failed to start LinkedIn profile search. Please try again.");
    } finally {
      // Add a small delay to make the animation more noticeable
      setTimeout(() => {
        setIsFindingProfiles(false);
        setShowAnimation(false);
      }, 1500);
    }
  };

  // Use the file upload handler directly from the hook
  const fileUploadHandler = handleFileUpload;

  return (
    <Card className="p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <SearchFormHeader isProcessingComplete={isProcessingComplete} />

        {!hideSearchTypeToggle && (
          <SearchTypeToggle
            value={searchType as SearchType} // Cast to SearchType
            onValueChange={(value) => setSearchType(value as SearchType)} // Cast to SearchType
          />
        )}

        {searchType === "candidates-at-company" && (
          <CompanyNameInput
            companyName={companyName}
            onChange={setCompanyName}
            isProcessing={isProcessing}
          />
        )}

        {/* Requirements Input Section */}
        {!hasSearched ? (
          <div className="space-y-3">
            <div className="px-3 py-4 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
              <ChatStyleInput
                value={searchText}
                onChange={setSearchText}
                onFileSelect={(file) => {
                  // Create a synthetic event to pass to the existing handler
                  const syntheticEvent = {
                    target: { files: [file] },
                    preventDefault: () => {},
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  fileUploadHandler(syntheticEvent);
                }}
                placeholder="Describe the ideal candidate, paste a job description, or use boolean search..."
                disabled={isProcessing}
                maxHeight={200}
              />
            </div>
            <div className="flex justify-center">
              <UploadRequirementsButton
                context="sourcing"
                size="md"
                variant="inline"
                onScrapedContent={(content) => {
                  setSearchText(content.text);
                  toast.success("Requirements imported successfully");
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => setCollapsedSections(prev => ({ ...prev, requirements: !prev.requirements }))}
              variant="outline"
              className="w-full justify-between border-2 border-black hover:bg-gray-50"
            >
              <span className="font-semibold">Edit Requirements</span>
              {collapsedSections.requirements ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            {!collapsedSections.requirements && (
              <div className="space-y-3 animate-in slide-in-from-top duration-200">
                <div className="px-3 py-4 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
                  <ChatStyleInput
                    value={searchText}
                    onChange={setSearchText}
                    onFileSelect={(file) => {
                      const syntheticEvent = {
                        target: { files: [file] },
                        preventDefault: () => {},
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      fileUploadHandler(syntheticEvent);
                    }}
                    placeholder="Describe the ideal candidate, paste a job description, or use boolean search..."
                    disabled={isProcessing}
                    maxHeight={200}
                  />
                </div>
                <div className="flex justify-center">
                  <UploadRequirementsButton
                    context="sourcing"
                    size="md"
                    variant="inline"
                    onScrapedContent={(content) => {
                      setSearchText(content.text);
                      toast.success("Requirements imported successfully");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display generated search string and Find Profiles button */}
        {showSearchString && searchString && (
          <div className="space-y-4">
            {/* Instructions - only show if not searched yet */}
            {!hasSearched && (
              <div className="p-4 bg-[#FEF7CD] rounded-lg border-2 border-black">
                <h3 className="text-sm font-bold mb-2">What's Next?</h3>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold">✏️</span>
                    <span>You can edit the search string below to refine your search criteria</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">🔄</span>
                    <span>Click "Regenerate Search String" to create a new search with updated requirements</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">🔍</span>
                    <span>When you click "Find LinkedIn Profiles", we'll search Google for matching LinkedIn profiles</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">📋</span>
                    <span>You'll see a list of candidates with their job titles, companies, and locations</span>
                  </li>
                </ul>
              </div>
            )}
            
            {/* Boolean Explanation - Always show when available */}
            {booleanExplanation && !collapsedSections.boolean && (
              <BooleanExplanation
                explanation={booleanExplanation}
                isLoading={isExplaining}
                onSimpler={() => handleComplexityChange('simpler')}
                onMoreComplex={() => handleComplexityChange('complex')}
                isRegenerating={isProcessing}
              />
            )}

            {/* Search string editor - collapsible after search */}
            {!hasSearched ? (
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-black">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm text-gray-600">Generated Search String:</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySearchString}
                    className="hover:bg-gray-200"
                    aria-label="Copy search string"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                  className="mt-2 font-mono text-sm resize-none focus:ring-2 focus:ring-black"
                  rows={4}
                  readOnly={false}
                  aria-label="Generated search string"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => setCollapsedSections(prev => ({ ...prev, boolean: !prev.boolean }))}
                  variant="outline"
                  className="w-full justify-between border-2 border-black hover:bg-gray-50"
                >
                  <span className="font-semibold">{booleanExplanation ? 'Boolean Search & Explanation' : 'Edit Boolean Search'}</span>
                  {collapsedSections.boolean ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                {!collapsedSections.boolean && (
                  <div className="space-y-4 animate-in slide-in-from-top duration-200">
                    {/* Boolean Explanation - Show here when collapsed */}
                    {booleanExplanation && (
                      <BooleanExplanation
                        explanation={booleanExplanation}
                        isLoading={isExplaining}
                        onSimpler={() => handleComplexityChange('simpler')}
                        onMoreComplex={() => handleComplexityChange('complex')}
                        isRegenerating={isProcessing}
                      />
                    )}
                    
                    <div className="p-4 bg-gray-100 rounded-lg border-2 border-black">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-sm text-gray-600">Generated Search String:</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopySearchString}
                          className="hover:bg-gray-200"
                          aria-label="Copy search string"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={searchString}
                        onChange={(e) => setSearchString(e.target.value)}
                        className="mt-2 font-mono text-sm resize-none focus:ring-2 focus:ring-black"
                        rows={4}
                        readOnly={false}
                        aria-label="Generated search string"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Find LinkedIn Profiles button with animation */}
            <div className="mt-3">
              <Button
                type="button" // Ensure it doesn't submit the form
                onClick={handleFindLinkedInProfiles}
                disabled={isFindingProfiles || !searchString} // Disable if no string or already finding
                className={`w-full border-2 border-black bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all duration-300 ${
                  isFindingProfiles ? 'animate-pulse' : ''
                } transform hover:scale-[1.02] active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]`}
                variant="secondary" // Keep variant if styled appropriately
              >
                {isFindingProfiles ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finding Profiles...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find LinkedIn Profiles
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Submit Button Section */}
        <div className="flex justify-end">
          <SubmitButton
            isProcessing={isProcessing}
            isDisabled={isProcessing || !searchText.trim()}
            buttonText={submitButtonText || (searchString ? 'Regenerate Search String' : undefined)}
          />
        </div>
      </form>
      
      {/* Loading Animation */}
      <GeneratingAnimation
        isOpen={showAnimation}
        stage={animationStage}
      />
    </Card>
  );
};
