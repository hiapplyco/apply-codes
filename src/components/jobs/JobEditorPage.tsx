
import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Dashboard } from '../dashboard/Dashboard';
import { formatJobData, formatAnalysisContent } from './utils/formatAnalysis';
import { DEFAULT_CARD_CONFIGS } from './constants/cardConfigs';
import { JobEditorHeader } from './editor/JobEditorHeader';
import { JobEditorContent } from './editor/JobEditorContent';
import { useJobEditor } from './hooks/useJobEditor';

export function JobEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    job, 
    isLoading, 
    error, 
    isSourceLoading,
    isPostLoading,
    handleSourceCandidates,
    handleCreateLinkedInPost
  } = useJobEditor(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load job analysis",
      variant: "destructive",
    });
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        Error loading job analysis
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No job found
      </div>
    );
  }

  const formattedData = formatJobData(job.analysis);

  // Convert analysis to string if it isn't already
  const analysisContent = typeof job.analysis === 'string' 
    ? job.analysis 
    : JSON.stringify(job.analysis);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <JobEditorHeader 
        onSourceCandidates={() => handleSourceCandidates(analysisContent)}
        onCreateLinkedInPost={() => handleCreateLinkedInPost(analysisContent)}
        isSourceLoading={isSourceLoading}
        isPostLoading={isPostLoading}
        jobId={Number(id)}
      />

      {formattedData && (
        <div className="mb-8">
          <Dashboard data={formattedData} configs={DEFAULT_CARD_CONFIGS} />
        </div>
      )}

      <JobEditorContent initialContent={job} />
    </div>
  );
}
