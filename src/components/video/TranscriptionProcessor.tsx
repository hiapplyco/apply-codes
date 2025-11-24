import { functionBridge } from "@/lib/function-bridge";
import { toast } from "sonner";

interface TranscriptionProcessorProps {
  onTranscriptionComplete: (text: string) => void;
}

export const TranscriptionProcessor = () => {
  const processRecording = async (recordingId: string): Promise<string> => {
    try {
      console.log('Starting video processing for recording:', recordingId);
      
      // Start the video processing pipeline
      const processingData = await functionBridge.processRecording({ recordingId });

      if (processingData?.analysis) {
        toast.success('Recording processed successfully');
        return processingData.analysis;
      }

      return '';
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Error processing recording');
      return '';
    }
  };

  return { processRecording };
};
