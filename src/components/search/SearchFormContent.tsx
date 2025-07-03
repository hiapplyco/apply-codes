import { SearchType } from "./types"; // Keep type for potential future use or backend mapping
import { Input } from "@/components/ui/input"; // Use standard Input
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MoreVertical, Upload, Mic, Globe, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CaptureWindow } from "./CaptureWindow";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SubmitButton } from "./SubmitButton"; // Keep SubmitButton
import { StructuredSearchResults } from "./StructuredSearchResults"; // Use structured results instead
import { useState, memo } from "react"; // Added useState, memo

// Removed imports: RollingGallery, Card, Users, Building2, Briefcase, FormHeader, ContentTextarea, CompanyNameInput

interface SearchFormContentProps {
  searchText: string; // This will now hold the single input value
  isProcessing: boolean;
  isScrapingProfiles: boolean; // Keep for loading state on submit
  searchString: string; // Keep for Google Search Window (used as initialSearchString)
  // Removed searchType, companyName, onSearchTypeChange, onCompanyNameChange
  onSearchTextChange: (value: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  // Combined props from merge conflict
  hideSearchTypeToggle?: boolean; // From upstream (though toggle itself is removed below)
  submitButtonText?: string; // From upstream
  onTextUpdate: (text: string) => void; // From stashed (needed for URL/Audio updates)
}

// Keep memoized components needed
const MemoizedSubmitButton = memo(SubmitButton);
const MemoizedStructuredSearchResults = memo(StructuredSearchResults);

export const SearchFormContent = ({
  searchText,
  isProcessing,
  isScrapingProfiles,
  searchString, // This prop holds the value to pass as initialSearchString
  onSearchTextChange,
  onFileUpload,
  onSubmit,
  hideSearchTypeToggle = false, // Default from upstream (kept for prop compatibility, but UI removed)
  submitButtonText, // From upstream
  onTextUpdate, // From stashed
}: SearchFormContentProps) => {
  const isMobile = useIsMobile();
  const [showCaptureWindow, setShowCaptureWindow] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isContentUpdating, setIsContentUpdating] = useState(false); // Keep for URL scraping feedback

  // --- Start: Logic moved from ContentTextarea (Stashed version) ---
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    try { new URL(urlInput); } catch { toast.error("Invalid URL format"); return; }

    setIsScrapingUrl(true);
    setShowUrlDialog(false);
    toast.info("Analyzing website content...");

    try {
      const result = await FirecrawlService.crawlWebsite(urlInput);
      if (!result.success) throw new Error(result.error || "Failed to scrape website");
      if (result.data?.text) {
        setIsContentUpdating(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        onTextUpdate(result.data.text); // Update the main input with scraped text
        toast.success("Website content analyzed successfully!");
      } else {
        throw new Error("No content found on the webpage");
      }
    } catch (error) {
      console.error("URL scraping error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze website");
    } finally {
      setIsScrapingUrl(false);
      setUrlInput("");
      setIsContentUpdating(false);
    }
  };

  const renderInputActions = () => {
    if (isMobile) {
      // Mobile dropdown remains similar
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-md">
            <MoreVertical className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-2 border-black">
            <DropdownMenuItem className="cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>Upload File</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowCaptureWindow(true)}>Record Audio</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowUrlDialog(true)} disabled={isScrapingUrl}>Paste URL</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const buttonBaseClasses = "inline-flex items-center px-4 py-2 bg-white border-2 border-black rounded font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all min-w-[140px] justify-center h-[40px]";

    return (
      <div className="flex gap-2">
        <div className="relative">
          {/* Use onFileUpload prop for the hidden input */}
          <input type="file" accept=".pdf,image/*,.txt,text/plain,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.rtf,application/rtf,.odt,application/vnd.oasis.opendocument.text" onChange={onFileUpload} className="hidden" id="file-upload" disabled={isProcessing} />
          <label htmlFor="file-upload" className={`${buttonBaseClasses} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <Upload className="h-4 w-4 mr-2" /> {isProcessing ? 'Processing...' : 'Attach File'}
          </label>
        </div>
        <Button onClick={() => setShowCaptureWindow(true)} className={buttonBaseClasses} disabled={isProcessing}>
          <Mic className="h-4 w-4 mr-2" /> Record Audio
        </Button>
        <Button onClick={() => setShowUrlDialog(true)} className={buttonBaseClasses} disabled={isProcessing || isScrapingUrl}>
          <Globe className="h-4 w-4 mr-2" /> {isScrapingUrl ? 'Scraping...' : 'Add URL'}
        </Button>
      </div>
    );
  };
  // --- End: Logic moved from ContentTextarea ---


  return (
    <>
      {/* Removed Carousel */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Single Input Field (Stashed version / HEAD) */}
        <div className="space-y-2">
           <Label htmlFor="mainSearchInput" className="text-xl font-bold">Sourcing Input</Label>
           <Input
             id="mainSearchInput"
             placeholder="Who or what are you sourcing for?"
             value={searchText}
             onChange={(event) => {
               console.log("Input onChange fired. Value:", event.target.value); // Log the event
               onSearchTextChange(event.target.value);
             }}
             className={cn(
               "w-full p-4 border-4 border-black rounded bg-white resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-medium focus:ring-0 focus:border-black transition-all duration-300",
               isContentUpdating && "animate-pulse" // Keep pulse for URL scraping feedback
             )}
             disabled={isProcessing || isScrapingUrl} // Disable during processing/scraping
           />
           <p className="text-sm text-gray-600 px-1">
             You can paste job requirements, describe your ideal candidate, enter a company URL, or use the buttons below to upload a resume/file or record audio.
           </p>
        </div>

        {/* Action Buttons - Rendered using moved logic (Stashed version) */}
        <div className="flex justify-start pt-2"> {/* Align buttons */}
           {renderInputActions()}
        </div>

        {/* Removed CompanyNameInput */}

        {/* Submit Button (Stashed version's disabled logic / HEAD) */}
        <div className="space-y-4 pt-4">
          <MemoizedSubmitButton
            isProcessing={isProcessing || isScrapingProfiles}
            // Simplified disabled logic: disable if processing or input is empty
            isDisabled={isProcessing || isScrapingProfiles || !searchText?.trim()}
            buttonText={submitButtonText} // Use prop from upstream
          />
          {isScrapingProfiles && ( // Keep loading indicator
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scraping profiles from search results...</span>
            </div>
          )}
        </div>
      </form>

      {/* Structured Search Results */}
      {searchString && ( // Conditionally render based on searchString prop
        <div className="mt-6">
          {/* Pass the searchString prop for structured results */}
          <MemoizedStructuredSearchResults searchString={searchString} searchType="candidates" />
        </div>
      )}

      {/* Hidden file input needed by renderInputActions */}
      <input type="file" id="file-upload" className="hidden" onChange={onFileUpload} accept=".pdf,image/*,.txt,text/plain,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.rtf,application/rtf,.odt,application/vnd.oasis.opendocument.text" />

      {/* Audio Capture Window - Keep as is */}
      {showCaptureWindow && (
        <CaptureWindow onTextUpdate={(text) => {
          onTextUpdate(text); // Use the passed prop
          setShowCaptureWindow(false);
        }} />
      )}

      {/* URL Dialog - Keep as is */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
         <DialogContent className="sm:max-w-[425px] animate-in fade-in-0 zoom-in-95">
           <DialogHeader>
             <DialogTitle>Add Website URL</DialogTitle>
             <DialogDescription>
               Enter the URL of the website you want to analyze. The content will be processed and added to the main input.
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="url">Website URL</Label>
               <Input id="url" type="url" placeholder="https://example.com" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} className="w-full" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleUrlSubmit(); }}} />
             </div>
             <div className="flex justify-end space-x-2">
               <Button variant="outline" onClick={() => setShowUrlDialog(false)}>Cancel</Button>
               <Button onClick={handleUrlSubmit} disabled={!urlInput.trim() || isScrapingUrl}>{isScrapingUrl ? 'Processing...' : 'Add Content'}</Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </>
  );
};

SearchFormContent.displayName = 'SearchFormContent'; // Keep display name
