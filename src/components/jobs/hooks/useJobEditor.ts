
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

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
        if (!jobId) {
          throw new Error('Invalid job ID');
        }

        if (!db) {
          throw new Error('Firestore is not initialized');
        }

        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
          throw new Error('Job not found');
        }

        const jobData = jobSnap.data();

        let enhancedContent: string | null = null;
        try {
          const agentRef = doc(db, 'agent_outputs', jobId);
          const agentSnap = await getDoc(agentRef);
          if (agentSnap.exists()) {
            enhancedContent = agentSnap.data()?.enhanced_description || null;
          }
        } catch (agentError) {
          console.warn('Failed to load enhanced content:', agentError);
        }

        setJob({
          ...jobData,
          id: jobId,
          enhanced_content: enhancedContent
        });
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
    if (!jobId) {
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
        jobId,
        autoRun: true
      } 
    });
  };

  const handleCreateLinkedInPost = async (analysisContent: string) => {
    setIsPostLoading(true);
    try {
      if (!jobId) {
        throw new Error('Invalid job ID');
      }
      
      // Process for LinkedIn post generation
      navigate('/linkedin-post', { 
        state: { 
          content: analysisContent,
          jobId,
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
