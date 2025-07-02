
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, FileText, Loader2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface JobEditorHeaderProps {
  onSourceCandidates: () => void;
  onCreateLinkedInPost: () => void;
  isSourceLoading: boolean;
  isPostLoading: boolean;
  jobId: number;
  jobContent?: string;
}

export function JobEditorHeader({ 
  onSourceCandidates, 
  onCreateLinkedInPost, 
  isSourceLoading, 
  isPostLoading,
  jobId
}: JobEditorHeaderProps) {
  const navigate = useNavigate();
  
  const handleNavigateBack = () => {
    // Navigate back to content creation page
    navigate('/content-creation');
  };

  const handleGoToSourcing = () => {
    navigate('/sourcing', { 
      state: { 
        jobId,
        autoRun: true
      } 
    });
  };

  const handlePublish = () => {
    toast({
      title: "Coming Soon",
      description: "Job publishing functionality will be available soon!",
    });
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigateBack}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-4">
          <Button 
            onClick={handlePublish}
            className="flex items-center gap-2 bg-[#8B5CF6] text-white hover:bg-[#7C3AED] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <Send className="h-4 w-4" />
            Publish
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleGoToSourcing}
            disabled={isSourceLoading}
            className="flex items-center gap-2"
          >
            {isSourceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            Source Candidates
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onCreateLinkedInPost}
            disabled={isPostLoading}
            className="flex items-center gap-2"
          >
            {isPostLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Create LinkedIn Post
          </Button>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold">Job Editor</h1>
    </div>
  );
}
