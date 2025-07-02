
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProjectContext } from "@/context/ProjectContext";

interface UseJobPostingFormProps {
  jobId?: string;
  onSuccess?: (jobData?: { id: number; booleanSearch?: string; title?: string }) => void;
  onError?: (errorMessage: string) => void;
}

interface FormState {
  content: string;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
}

interface JobData {
  content: string;
  created_at: string;
  user_id: string;
  id?: number;
}

export function useJobPostingForm({ jobId, onSuccess, onError }: UseJobPostingFormProps) {
  const STORAGE_KEY = 'jobPostingFormData';
  
  // Initialize form state with sessionStorage data if available
  const getInitialContent = () => {
    if (!jobId) {
      const savedData = sessionStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.content || "";
        } catch {
          return "";
        }
      }
    }
    return "";
  };
  
  const [formState, setFormState] = useState<FormState>({
    content: getInitialContent(),
    isSubmitting: false,
    isLoading: !!jobId, // Set initial loading state to true if we're editing an existing job
    error: null
  });
  const navigate = useNavigate();
  const { session } = useAuth();
  const { selectedProjectId } = useProjectContext();

  // Fetch existing job data if editing
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setFormState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      try {
        console.log("Fetching job with ID:", jobId);
        const { data, error } = await supabase
          .from("jobs")
          .select("content")
          .eq("id", Number(jobId))
          .single();

        if (error) {
          console.error("Error fetching job:", error);
          setFormState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: error.message 
          }));
          if (onError) onError(error.message);
          toast({
            title: "Error",
            description: `Failed to load job: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        if (data) {
          console.log("Job data fetched successfully:", data);
          setFormState(prev => ({ 
            ...prev, 
            content: data.content || "",
            isLoading: false 
          }));
        } else {
          console.error("No job data found");
          const errorMessage = "Job not found";
          setFormState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: errorMessage
          }));
          if (onError) onError(errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching job:", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setFormState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: errorMessage
        }));
        if (onError) onError(errorMessage);
      }
    };

    // Call fetchJob to load data (or set loading to false if no jobId)
    fetchJob();
  }, [jobId, onError]);

  const handleContentChange = (value: string) => {
    setFormState(prev => ({ ...prev, content: value }));
    // Save to sessionStorage for persistence
    if (!jobId) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ content: value }));
    }
  };

  const validateSubmission = () => {
    if (!session?.user) {
      const errorMessage = "You must be logged in to create a job posting";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      if (onError) onError(errorMessage);
      return false;
    }
    
    if (!formState.content.trim()) {
      const errorMessage = "Please enter job details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      if (onError) onError(errorMessage);
      return false;
    }

    return true;
  };

  const generateBooleanSearch = async (newJobId: number, jobTitle?: string) => {
    console.log("Generating boolean search...");
    try {
      const { data: booleanData, error: booleanError } = await supabase.functions
        .invoke('generate-boolean-search', {
          body: { 
            description: formState.content,
            jobTitle: jobTitle,
            userId: session?.user?.id
          }
        });

      if (booleanError) {
        console.error("Boolean generation error:", booleanError);
        throw booleanError;
      }

      console.log("Boolean search generated:", booleanData);
      
      if (booleanData?.searchString) {
        // Update the job record with the boolean search
        const updateData: any = { 
          search_string: booleanData.searchString,
          metadata: {
            boolean_generated: true,
            boolean_generated_at: new Date().toISOString()
          }
        };
        
        const { error: updateError } = await supabase
          .from("jobs")
          .update(updateData)
          .eq("id", newJobId);

        if (updateError) {
          console.error("Error updating search string:", updateError);
          // Don't throw - we still have the boolean search to return
        }
      }

      return booleanData?.searchString || null;
    } catch (error) {
      console.error("Error generating boolean search:", error);
      // Return null instead of throwing to prevent job save failure
      return null;
    }
  };

  const enhanceJobPosting = async (newJobId: number) => {
    console.log("Enhancing job posting...");
    try {
      const { data: enhancedData, error: enhanceError } = await supabase.functions
        .invoke('enhance-job-posting', {
          body: { 
            content: formState.content,
            jobId: newJobId
          }
        });

      if (enhanceError) {
        console.error("Enhancement error:", enhanceError);
        throw enhanceError;
      }

      console.log("Enhancement completed:", enhancedData);
      
      if (enhancedData?.content) {
        // Store the enhanced content in agent_outputs table
        const { error: insertError } = await supabase
          .from("agent_outputs")
          .upsert({ 
            job_id: newJobId,
            enhanced_description: enhancedData.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'job_id'
          });

        if (insertError) {
          console.error("Error storing enhanced content:", insertError);
        }
      }

      return enhancedData;
    } catch (error) {
      console.error("Error during enhancement:", error);
      return null;
    }
  };

  const analyzeJobPosting = async (newJobId: number) => {
    console.log("Analyzing job posting...");
    try {
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-schema', {
          body: { schema: formState.content }
        });

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        throw analysisError;
      }

      console.log("Analysis completed:", analysisData);
      
      if (!analysisData) {
        console.warn("No analysis data returned");
        return null;
      }
      
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ analysis: analysisData })
        .eq("id", newJobId);

      if (updateError) {
        console.error("Error updating analysis:", updateError);
        throw updateError;
      }

      return analysisData;
    } catch (error) {
      console.error("Error during analysis:", error);
      // Return null instead of throwing to prevent job save failure
      return null;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSubmission()) return;

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      if (!session?.user?.id) {
        throw new Error("User ID not found");
      }

      const jobData = {
        content: formState.content,
        created_at: new Date().toISOString(),
        user_id: session.user.id,
        project_id: selectedProjectId,
      };

      // Create or update the job record
      console.log("Attempting to save job with data:", jobData);
      const { data: jobResult, error: jobError } = await (jobId ? 
        supabase.from("jobs").update(jobData).eq("id", Number(jobId)).select('id').single() : 
        supabase.from("jobs").insert(jobData).select('id').single());

      if (jobError) {
        console.error("Supabase error saving job:", jobError);
        // Check if it's a table not found error
        if (jobError.message?.includes('relation "public.jobs" does not exist')) {
          throw new Error("Database table 'jobs' not found. Please contact support.");
        }
        throw jobError;
      }
      if (!jobResult) throw new Error("No data returned from job creation/update");
      
      const newJobId = jobResult.id;
      console.log("Job created/updated with ID:", newJobId);

      // Generate boolean search and analyze in parallel
      let booleanSearch = null;
      let analysisResult = null;
      let jobTitle = null;

      // First, generate boolean search (fast operation)
      console.log("Attempting to generate boolean search for job:", newJobId);
      try {
        booleanSearch = await generateBooleanSearch(newJobId);
        console.log("Boolean search generated successfully:", booleanSearch);
      } catch (booleanError) {
        console.error("Boolean search generation failed, but job was saved:", booleanError);
      }

      // Generate enhanced content first (for the editor)
      const enhancementPromise = enhanceJobPosting(newJobId).catch(error => {
        console.warn("Enhancement failed, but job was saved:", error);
      });

      // Then analyze the job posting (slower operation, don't block on it)
      const analysisPromise = analyzeJobPosting(newJobId).then(result => {
        analysisResult = result;
        // Extract job title from analysis if available
        if (result && typeof result === 'object' && 'title' in result) {
          jobTitle = result.title;
        }
        return result;
      }).catch(analysisError => {
        console.warn("Analysis failed, but job was saved:", analysisError);
      });

      // If we're creating a new job and have a success callback
      if (!jobId && onSuccess) {
        // Clear the sessionStorage after successful submission
        sessionStorage.removeItem(STORAGE_KEY);
        
        // Always call the onSuccess callback with available data
        onSuccess({
          id: newJobId,
          booleanSearch: booleanSearch || undefined,
          title: jobTitle || undefined
        });
        
        // Only navigate if no boolean search was generated (fallback behavior)
        if (!booleanSearch) {
          toast({
            title: "Success",
            description: "Job created successfully! Boolean search generation is pending.",
          });
          
          // Navigate to the editor page as fallback
          console.log("Navigating to editor page (fallback):", `/job-editor/${newJobId}`);
          navigate(`/job-editor/${newJobId}`, { replace: true });
        }
      } else {
        // Show a success message for updates or when no modal is needed
        toast({
          title: "Success",
          description: jobId ? "Job updated successfully" : "Job created successfully",
        });
        
        // Call the onSuccess callback if provided (for backward compatibility)
        if (onSuccess) {
          onSuccess();
        }
        
        // Navigate to the editor page
        console.log("Navigating to editor page:", `/job-editor/${newJobId}`);
        navigate(`/job-editor/${newJobId}`, { replace: true });
      }

      // Wait for analysis to complete in the background
      await analysisPromise;

    } catch (error) {
      console.error("Error saving job:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save job posting";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        error: errorMessage
      }));
      if (onError) onError(errorMessage);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    content: formState.content,
    setContent: handleContentChange,
    isSubmitting: formState.isSubmitting,
    isLoading: formState.isLoading,
    error: formState.error,
    onSubmit
  };
}
