
import { useState, useEffect } from "react";
import { generateBooleanSearch as generateBooleanSearchFunction } from "@/lib/firebase/functions/generateBooleanSearch";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useNewAuth } from "@/context/NewAuthContext";
import { useProjectContext } from "@/context/ProjectContext";

interface UseJobPostingFormProps {
  jobId?: string;
  onSuccess?: (jobData?: { id: string; booleanSearch?: string; title?: string }) => void;
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
  id?: string;
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
  const { user } = useNewAuth();
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

        if (!db) {
          throw new Error("Firestore not initialized");
        }

        const jobRef = doc(db, "jobs", jobId);
        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
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
          return;
        }

        const data = jobSnap.data() as JobData;

        console.log("Job data fetched successfully:", data);
        setFormState(prev => ({ 
          ...prev, 
          content: data.content || "",
          isLoading: false 
        }));
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
    if (!user) {
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

  const generateBooleanSearch = async (newJobId: string, jobTitle?: string) => {
    console.log("Generating boolean search...");
    try {
      const response = await generateBooleanSearchFunction({
        description: formState.content,
        jobTitle,
        userId: user?.uid
      });

      if (!response?.success) {
        const errorMessage = response?.error || "Failed to generate boolean search";
        console.error("Boolean generation error:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("Boolean search generated:", response.searchString);
      
      if (response.searchString) {
        if (!db) {
          throw new Error("Firestore not initialized");
        }

        const jobRef = doc(db, "jobs", newJobId);
        await updateDoc(jobRef, {
          search_string: response.searchString,
          metadata: {
            boolean_generated: true,
            boolean_generated_at: new Date().toISOString()
          }
        });
      }

      return response.searchString || null;
    } catch (error) {
      console.error("Error generating boolean search:", error);
      // Return null instead of throwing to prevent job save failure
      return null;
    }
  };

  const enhanceJobPosting = async (newJobId: string) => {
    console.log("Enhancing job posting...");
    try {
      const enhancedResult = await functionBridge.enhanceJobDescription({
        content: formState.content,
        jobId: newJobId
      });

      console.log("Enhancement completed:", enhancedResult);

      const enhancedContent =
        enhancedResult?.enhancedDescription ||
        enhancedResult?.content ||
        enhancedResult?.result ||
        null;

      if (enhancedContent && db) {
        try {
          const agentOutputRef = doc(db, "agent_outputs", newJobId);
          const timestamp = new Date().toISOString();
          await setDoc(
            agentOutputRef,
            {
              job_id: newJobId,
              enhanced_description: enhancedContent,
              updated_at: timestamp,
              created_at: timestamp
            },
            { merge: true }
          );
        } catch (firestoreError) {
          console.error("Error storing enhanced content:", firestoreError);
        }
      }

      return enhancedContent ? { content: enhancedContent } : null;
    } catch (error) {
      console.error("Error during enhancement:", error);
      return null;
    }
  };

  const analyzeJobPosting = async (newJobId: string) => {
    console.log("Analyzing job posting...");
    try {
      const [termsResult, compensationResult, summaryResult] = await Promise.all([
        functionBridge.extractNlpTerms({ content: formState.content }),
        functionBridge.analyzeCompensation({ content: formState.content }),
        functionBridge.summarizeJob({ content: formState.content })
      ]);

      const analysisData = {
        generatedAt: new Date().toISOString(),
        terms: termsResult?.terms || termsResult,
        compensation: compensationResult?.analysis || compensationResult,
        summary: summaryResult?.summary || summaryResult
      };

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      const jobRef = doc(db, "jobs", newJobId);
      await updateDoc(jobRef, {
        analysis: analysisData,
        updated_at: new Date().toISOString()
      });

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
      if (!user?.uid) {
        throw new Error("User ID not found");
      }

      if (!db) {
        throw new Error("Firestore not initialized");
      }

      const timestamp = new Date().toISOString();

      let newJobId: string;

      if (jobId) {
        console.log("Updating job with ID:", jobId);
        const jobRef = doc(db, "jobs", jobId);
        await updateDoc(jobRef, {
          content: formState.content,
          project_id: selectedProjectId || null,
          updated_at: timestamp
        });
        newJobId = jobId;
      } else {
        console.log("Creating new job");
        const jobsCollection = collection(db, "jobs");
        const newJobRef = doc(jobsCollection);
        await setDoc(newJobRef, {
          id: newJobRef.id,
          content: formState.content,
          project_id: selectedProjectId || null,
          user_id: user.uid,
          created_at: timestamp,
          updated_at: timestamp
        });
        newJobId = newJobRef.id;
      }
      
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
