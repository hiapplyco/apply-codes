
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { functionBridge } from "@/lib/function-bridge";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { uploadRecording } from "@/lib/firebase-storage";

interface CaptureWindowProps {
  onTextUpdate?: (text: string) => void;
}

export const CaptureWindow = ({ onTextUpdate }: CaptureWindowProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup function to stop all tracks when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (dataEvent) => {
        if (dataEvent.data.size > 0) {
          chunksRef.current.push(dataEvent.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          const user = auth?.currentUser;
          if (!user) {
            toast.error('User not authenticated');
            return;
          }

          // Upload to Firebase Storage with progress tracking
          toast.info('Uploading recording...');
          const recordingUrl = await uploadRecording(user.uid, recordingBlob, (progress) => {
            console.log(`Upload progress: ${progress}%`);
          });

          // Process with OpenAI Whisper using Firebase Storage URL
          toast.info('Processing audio...');
          const data = await functionBridge.processRecording({ url: recordingUrl, type: 'audio' });

          if (data?.text && onTextUpdate) {
            onTextUpdate(data.text);
            toast.success('Recording processed successfully');
          } else {
            toast.warning('No text was extracted from the recording');
          }
        } catch (error) {
          console.error('Error processing recording:', error);

          // Provide more specific error messages
          let errorMessage = 'Failed to process recording';
          if (error instanceof Error) {
            if (error.message.includes('not authenticated')) {
              errorMessage = 'Please sign in again to upload recordings';
            } else if (error.message.includes('quota exceeded')) {
              errorMessage = 'Storage quota exceeded. Please try again later';
            } else if (error.message.includes('unauthorized')) {
              errorMessage = "You don't have permission to upload recordings";
            } else if (error.message.includes('network')) {
              errorMessage = 'Network error. Please check your connection and try again';
            }
          }

          toast.error(errorMessage);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      toast.success('Recording stopped, processing audio...');
    }
  };

  return (
    <Card className="p-6 mt-6 border-4 border-black bg-[#FFFBF4] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Capture Audio Content</h2>
        <p className="text-gray-600">
          Record interviews, intake calls, or hiring manager screens to generate search queries
        </p>
        
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-[#8B5CF6] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                hover:bg-[#7C3AED] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                transition-all"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:bg-red-600 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                transition-all"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
