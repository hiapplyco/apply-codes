import { useEffect, useState } from "react";
import { functionBridge } from "@/lib/function-bridge";
import { firestoreClient } from "@/lib/firebase-database-bridge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useClientAgentOutputs } from "@/stores/useClientAgentOutputs";
import { useMutation } from "@tanstack/react-query";

interface ProcessAgentProps {
  content: string;
  jobId: number;
  onComplete: () => void;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
}

export const ProcessAgent = ({ content, jobId, onComplete }: ProcessAgentProps) => {
  const { toast } = useToast();
  const { setOutput } = useClientAgentOutputs();
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { name: "Creating X-Ray Search", status: 'pending', progress: 0 },
    { name: "Analyzing Compensation", status: 'pending', progress: 0 },
    { name: "Enhancing Description", status: 'pending', progress: 0 },
    { name: "Creating Summary", status: 'pending', progress: 0 }
  ]);

  const updateStepStatus = (index: number, status: ProcessingStep['status'], progress: number) => {
    setSteps(currentSteps => 
      currentSteps.map((step, stepIndex) => 
        stepIndex === index ? { ...step, status, progress } : step
      )
    );
  };

  const processStep = async (
    index: number,
    stepLabel: string,
    invoke: () => Promise<any>,
    responseKey: string
  ): Promise<any> => {
    try {
      updateStepStatus(index, 'processing', 25);
      
      const response = await invoke();
      updateStepStatus(index, 'complete', 100);
      
      return response?.[responseKey];
    } catch (error) {
      console.error(`Error in ${stepLabel}:`, error);
      updateStepStatus(index, 'error', 0);
      throw error;
    }
  };

  const persistToDatabase = useMutation({
    mutationFn: async (agentOutput: any) => {
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
    },
    onError: (error) => {
      console.error('Error persisting to database:', error);
    },
    onSuccess: () => {
      console.log('Successfully persisted agent output to database');
      onComplete();
    }
  });

  useEffect(() => {
    let isMounted = true;

    const processContent = async () => {
      try {
        // Process terms
        const terms = await processStep(
          0,
          'extract-nlp-terms',
          () => functionBridge.extractNlpTerms({ content }),
          'terms'
        );
        if (!isMounted) return;
        
        // Process compensation
        const compensationData = await processStep(
          1,
          'analyze-compensation',
          () => functionBridge.analyzeCompensation({ content }),
          'analysis'
        );
        if (!isMounted) return;
        
        // Process description
        const enhancerData = await processStep(
          2,
          'enhance-job-description',
          () => functionBridge.enhanceJobDescription({ content }),
          'enhancedDescription'
        );
        if (!isMounted) return;
        
        // Process summary
        const summaryData = await processStep(
          3,
          'summarize-job',
          () => functionBridge.summarizeJob({ content }),
          'summary'
        );
        if (!isMounted) return;

        // Create agent output object
        const agentOutput = {
          id: Date.now(),
          job_id: jobId,
          created_at: new Date().toISOString(),
          terms,
          compensation_analysis: compensationData,
          enhanced_description: enhancerData,
          job_summary: summaryData
        };

        // Update client-side state immediately
        setOutput(jobId, agentOutput);
        console.log('Set client-side agent output:', agentOutput);

        // Persist to database in the background
        persistToDatabase.mutate(agentOutput);

        toast({
          title: "Analysis Complete",
          description: "Your report is ready to view",
        });

      } catch (error) {
        console.error('Error in agent processing:', error);
        if (!isMounted) return;
        
        toast({
          title: "Error",
          description: "Failed to process content. Please try again.",
          variant: "destructive",
        });
      }
    };

    processContent();
    return () => {
      isMounted = false;
    };
  }, [content, jobId, toast, setOutput, persistToDatabase, processStep]);

  return (
    <Card className="p-6 border-4 border-black bg-[#FFFBF4] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Analyzing Content</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {step.name}
                </span>
                <span className="text-sm text-gray-500">
                  {step.status === 'complete' ? '100%' : 
                   step.status === 'error' ? 'Error' :
                   step.status === 'processing' ? 'Processing...' : 
                   'Pending'}
                </span>
              </div>
              <Progress 
                value={step.progress} 
                className="h-2"
                indicatorClassName={
                  step.status === 'error' ? 'bg-red-500' :
                  step.status === 'complete' ? 'bg-green-500' :
                  'bg-blue-500'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
