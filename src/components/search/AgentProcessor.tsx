import { useState, useEffect } from "react";
import { functionBridge } from "@/lib/function-bridge";
import { firestoreClient } from "@/lib/firebase-database-bridge";
import { useToast } from "@/hooks/use-toast";
import { useClientAgentOutputs } from "@/stores/useClientAgentOutputs";
import { useMutation } from "@tanstack/react-query";
import { ProcessingProgress } from "./ProcessingProgress";
import { PROCESSING_STEPS, ERROR_MESSAGES } from "./constants/processingSteps";
import { AgentOutput } from "@/types/agent";

interface AgentProcessorProps {
  content: string;
  jobId: number;
  onComplete: () => void;
}

interface ProcessStepResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export const AgentProcessor = ({ content, jobId, onComplete }: AgentProcessorProps) => {
  const { toast } = useToast();
  const { setOutput } = useClientAgentOutputs();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = PROCESSING_STEPS[currentStepIndex];

  const processStep = async (
    stepLabel: string,
    invoke: () => Promise<any>,
    responseKey: string,
  ): Promise<unknown> => {
    try {
      console.log(`Starting ${stepLabel} processing...`);
      
      // Update progress before API call
      setCurrentStepIndex(prev => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
      
      const response = await invoke();
      
      console.log(`${stepLabel} response:`, response);
      
      // Update progress after successful API call
      setCurrentStepIndex(prev => Math.min(prev + 2, PROCESSING_STEPS.length - 1));
      return response?.[responseKey];
    } catch (error) {
      console.error(`Error in ${stepLabel}:`, error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)],
        variant: "destructive",
      });
      throw error;
    }
  };

  const persistToDatabase = useMutation({
    mutationFn: async (agentOutput: Partial<AgentOutput>) => {
      console.log('Persisting agent output to database:', agentOutput);
      
      const insertResult = await firestoreClient
        .from('agent_outputs')
        .insert({
          job_id: jobId,
          terms: agentOutput.terms,
          compensation_analysis: agentOutput.compensationData,
          enhanced_description: agentOutput.enhancerData,
          job_summary: agentOutput.summaryData
        });

      if (insertResult.error) throw insertResult.error;
      
      // Set progress to 100% and trigger completion
      setCurrentStepIndex(PROCESSING_STEPS.length - 1);
      
      // Ensure UI updates before completing
      await new Promise(resolve => setTimeout(resolve, 100));
      onComplete();
    },
    onError: (error) => {
      console.error('Error persisting to database:', error);
      toast({
        title: "Error",
        description: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)],
        variant: "destructive",
      });
    },
    onSuccess: () => {
      console.log('Successfully persisted agent output to database');
      toast({
        title: "Success",
        description: "Your purple squirrel report is ready! 🐿️",
      });
    }
  });

  useEffect(() => {
    let isMounted = true;

    const processContent = async () => {
      try {
        // Extract terms
        const terms = await processStep(
          'extract-nlp-terms',
          () => functionBridge.extractNlpTerms({ content }),
          'terms'
        );
        if (!isMounted) return;
        
        // Analyze compensation
        const compensationData = await processStep(
          'analyze-compensation',
          () => functionBridge.analyzeCompensation({ content }),
          'analysis'
        );
        if (!isMounted) return;
        
        // Enhance description
        const enhancerData = await processStep(
          'enhance-job-description',
          () => functionBridge.enhanceJobDescription({ content }),
          'enhancedDescription'
        );
        if (!isMounted) return;
        
        // Generate summary
        const summaryData = await processStep(
          'summarize-job',
          () => functionBridge.summarizeJob({ content }),
          'summary'
        );
        if (!isMounted) return;

        const agentOutput = {
          id: Date.now(),
          job_id: jobId,
          created_at: new Date().toISOString(),
          terms,
          compensation_analysis: compensationData,
          enhanced_description: enhancerData,
          job_summary: summaryData
        };

        setOutput(jobId, agentOutput);
        console.log('Set client-side agent output:', agentOutput);
        
        // Persist to database first
        await persistToDatabase.mutateAsync({
          terms,
          compensationData,
          enhancerData,
          summaryData
        });

        // Generate dashboard metrics as 5th step
        try {
          console.log('Starting dashboard metrics generation...');
          const metricsResponse = await functionBridge.generateDashboardMetrics({
            jobId: jobId.toString(),
            forceRefresh: true 
          });

          console.log('Dashboard metrics generated successfully:', metricsResponse);
        } catch (error) {
          console.error('Error generating dashboard metrics:', error);
          // Continue without failing - dashboard metrics are supplementary
        }

      } catch (error) {
        console.error('Error in agent processing:', error);
        if (!isMounted) return;
        
        toast({
          title: "Error",
          description: ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)],
          variant: "destructive",
        });
      }
    };

    processContent();
    return () => {
      isMounted = false;
    };
  }, [content, jobId]);

  return (
    <ProcessingProgress 
      message={currentStep.message}
      progress={currentStep.progress}
      isComplete={currentStepIndex === PROCESSING_STEPS.length - 1}
    />
  );
};
