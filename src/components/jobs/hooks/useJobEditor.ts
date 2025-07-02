
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function useJobEditor(jobId: string) {
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isPostLoading, setIsPostLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobIdNumber = Number(jobId);
        if (isNaN(jobIdNumber)) {
          throw new Error('Invalid job ID');
        }

        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobIdNumber)
          .single();

        if (jobError) throw jobError;

        // Also fetch enhanced content from agent_outputs
        const { data: agentData } = await supabase
          .from('agent_outputs')
          .select('enhanced_description')
          .eq('job_id', jobIdNumber)
          .single();

        // Merge the data
        const mergedData = {
          ...jobData,
          enhanced_content: agentData?.enhanced_description || null
        };

        setJob(mergedData);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleSourceCandidates = async (analysisContent: string) => {
    // Convert jobId to number before passing it to the navigation state
    const jobIdNumber = Number(jobId);
    if (isNaN(jobIdNumber)) {
      console.error('Invalid job ID:', jobId);
      toast({
        title: 'Error',
        description: 'Invalid job ID',
        variant: 'destructive',
      });
      return;
    }
    
    navigate('/sourcing', { 
      state: { 
        jobId: jobIdNumber,
        autoRun: true
      } 
    });
  };

  const handleCreateLinkedInPost = async (analysisContent: string) => {
    setIsPostLoading(true);
    try {
      // Convert jobId to number before passing it to the navigation state
      const jobIdNumber = Number(jobId);
      if (isNaN(jobIdNumber)) {
        throw new Error('Invalid job ID');
      }
      
      // Process for LinkedIn post generation
      navigate('/linkedin-post', { 
        state: { 
          content: analysisContent,
          jobId: jobIdNumber,
          autoRun: true
        } 
      });
    } catch (error) {
      console.error('Error creating LinkedIn post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create LinkedIn post',
        variant: 'destructive',
      });
    } finally {
      setIsPostLoading(false);
    }
  };

  return {
    job,
    isLoading,
    error,
    isSourceLoading,
    isPostLoading,
    handleSourceCandidates,
    handleCreateLinkedInPost,
  };
}
