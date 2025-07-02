import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Search, FileText, Copy, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface JobCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle?: string;
  booleanSearch?: string;
  onCreateAnother?: () => void;
}

export function JobCreatedModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  booleanSearch,
  onCreateAnother,
}: JobCreatedModalProps) {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSourceCandidates = () => {
    setIsNavigating(true);
    // Navigate to sourcing page with job parameters
    navigate(`/sourcing?jobId=${jobId}&autoSearch=true`);
    onClose();
  };

  const handleViewJob = () => {
    setIsNavigating(true);
    navigate(`/job-editor/${jobId}`);
    onClose();
  };

  const handleCopyBoolean = async () => {
    if (booleanSearch) {
      await navigator.clipboard.writeText(booleanSearch);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Boolean search copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    onClose();
    if (onCreateAnother) {
      onCreateAnother();
    }
  };

  // Truncate boolean search for preview
  const truncatedBoolean = booleanSearch && booleanSearch.length > 150
    ? booleanSearch.substring(0, 150) + "..."
    : booleanSearch;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <DialogTitle className="text-2xl font-bold">
              Job Posted Successfully!
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {jobTitle ? `Your "${jobTitle}" job posting has been created.` : "Your job posting has been created."}
            {booleanSearch ? " We've generated a boolean search to help you find qualified candidates." : " Processing your job details..."}
          </DialogDescription>
        </DialogHeader>

        {booleanSearch && (
          <Card className="p-4 bg-purple-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm">Generated Boolean Search:</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyBoolean}
                className="h-8 px-2"
              >
                {isCopied ? (
                  <span className="text-green-600 text-xs">Copied!</span>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <ScrollArea className="max-h-32">
              <p className="text-sm font-mono text-gray-700 break-all">
                {truncatedBoolean}
              </p>
            </ScrollArea>
          </Card>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold">What would you like to do next?</h3>
          
          {booleanSearch ? (
            <Button
              onClick={handleSourceCandidates}
              disabled={isNavigating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)] transition-all"
              size="lg"
            >
              {isNavigating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              Source Candidates Now
            </Button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                Boolean search generation is in progress. You can view your job details or create another posting while we process.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleViewJob}
              disabled={isNavigating}
              className="border-2 border-black hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Job Details
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCreateAnother}
              disabled={isNavigating}
              className="border-2 border-black hover:bg-gray-50"
            >
              Create Another
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isNavigating}
            className="text-gray-600"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}