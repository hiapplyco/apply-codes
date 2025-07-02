
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJobPostingForm } from "./hooks/useJobPostingForm";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadRequirementsButton } from "@/components/url-scraper";

interface JobPostingFormProps {
  jobId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (errorMessage: string) => void;
}

const placeholder = `Title: Software Engineer
Client: Example Corp
Location: San Francisco
Salary Range: 100000 - 150000
Job Type: Full-time
Experience Level: Mid
Skills Required: React, TypeScript, Node.js
Application Deadline: 2024-12-31
Remote Allowed: Yes

Description:
We are looking for a talented Software Engineer to join our team...`;

export function JobPostingForm({ jobId, onSuccess, onCancel, onError }: JobPostingFormProps) {
  const { content, setContent, isSubmitting, isLoading, error, onSubmit } = useJobPostingForm({ 
    jobId, 
    onSuccess,
    onError 
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-[#8B5CF6] mb-4" />
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label 
          htmlFor="content" 
          className="text-base font-bold text-gray-600"
        >
          Job Details
        </Label>
        <div className="space-y-3">
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] font-mono text-base border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]"
          />
          <div className="flex justify-center">
            <UploadRequirementsButton
              context="job-posting"
              size="md"
              variant="inline"
              onScrapedContent={(data) => {
                // Replace content with scraped content
                setContent(data.text);
              }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Include all relevant details about the job position
        </p>
      </div>

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {jobId ? "Update" : "Create"} Job Posting
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
