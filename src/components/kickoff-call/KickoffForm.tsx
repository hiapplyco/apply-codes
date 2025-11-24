
import { useState } from "react";
import { toast } from "sonner";
import { functionBridge } from "@/lib/function-bridge";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Loader } from "lucide-react";
import { useProjectContext } from "@/context/ProjectContext";

interface KickoffFormProps {
  isProcessing: boolean;
  filePaths: string[];
  title: string;
  onTitleChange: (title: string) => void;
}

export const KickoffForm = ({ isProcessing, filePaths, title, onTitleChange }: KickoffFormProps) => {
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState("");
  const [url, setUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const { selectedProjectId } = useProjectContext();

  const handleCrawl = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to crawl");
      return;
    }

    setIsCrawling(true);
    try {
      const result = await FirecrawlService.crawlWebsite(url);
      if (result.success && result.data?.text) {
        setTextInput(prev => prev + (prev ? '\n\n' : '') + result.data.text);
        toast.success("Successfully crawled website content!");
        setUrl('');
      } else {
        toast.error(result.error || "Failed to crawl website");
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast.error("Failed to crawl website");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !title.trim()) {
      toast.error("Please enter both a title and content");
      return;
    }

    setIsSubmitting(true);
    setProcessingStatus("Submitting kickoff call data to Gemini...");
    
    try {
      // Show processing toast so user knows processing has started
      toast.info("Processing kickoff call information with Gemini...", {
        duration: 5000,
        id: "processing-kickoff"
      });
      
      const result = await functionBridge.processKickoffCall({
        text: textInput,
        title,
        filePaths,
        projectId: selectedProjectId,
        userId: auth?.currentUser?.uid || null
      });

      // Update toast when processing is complete
      toast.success("Successfully processed kickoff call information!", {
        id: "processing-kickoff"
      });

      if (result?.id) {
        navigate(`/chat?callId=${result.id}&mode=kickoff`);
      } else {
        navigate('/chat');
      }

    } catch (error) {
      console.error('Error processing kickoff call:', error);
      toast.error("Failed to process kickoff call. Please try again.", {
        id: "processing-kickoff"
      });
    } finally {
      setIsSubmitting(false);
      setProcessingStatus("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="url" className="text-lg font-bold block">
          Website URL (optional)
        </label>
        <div className="flex gap-2">
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a website URL to scrape content"
            className="flex-1 p-4 border-4 border-black rounded bg-white 
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-medium focus:ring-0 focus:border-black
              transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              hover:translate-x-[2px] hover:translate-y-[2px]"
          />
          <Button
            type="button"
            onClick={handleCrawl}
            disabled={isCrawling || !url.trim()}
            className="bg-[#8B5CF6] text-white py-4 px-6 rounded font-bold text-lg border-4 
              border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 
              hover:translate-x-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
              animate-in fade-in duration-200"
          >
            {isCrawling ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Crawling...
              </div>
            ) : (
              'Crawl URL'
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="text-lg font-bold block">
          Notes or Paste Content
        </label>
        <textarea
          id="content"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter notes, requirements, or paste content here"
          className="w-full min-h-[200px] p-4 border-4 border-black rounded bg-white resize-none 
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-medium focus:ring-0 focus:border-black
            transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            hover:translate-x-[2px] hover:translate-y-[2px]"
        />
      </div>

      {filePaths.length > 0 && (
        <div className="p-4 border-2 border-green-500 bg-green-50 rounded-md">
          <p className="text-green-700 font-medium">
            {filePaths.length} file(s) successfully uploaded and ready for processing
          </p>
        </div>
      )}

      {processingStatus && (
        <div className="flex items-center gap-2 p-4 border-2 border-blue-500 bg-blue-50 rounded-md animate-pulse">
          <Loader className="h-5 w-5 text-blue-500 animate-spin" />
          <p className="text-blue-700 font-medium">{processingStatus}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-[#8B5CF6] text-white py-4 rounded font-bold text-lg border-4 
          border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 
          hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed animate-in fade-in duration-200"
        disabled={isSubmitting || !textInput.trim() || !title.trim()}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Processing with Gemini...
          </div>
        ) : (
          'Process Kickoff Call'
        )}
      </Button>
    </form>
  );
};
