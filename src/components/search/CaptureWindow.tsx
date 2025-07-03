
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast.error('User not authenticated');
            return;
          }

          // Upload to Supabase Storage
          const fileName = `${user.id}/${Date.now()}.webm`;
          const { error: uploadError } = await supabase.storage
            .from('recordings')
            .upload(fileName, recordingBlob);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('recordings')
            .getPublicUrl(fileName);

          // Process with OpenAI Whisper
          const { data, error } = await supabase.functions.invoke('process-recording', {
            body: { url: publicUrl, type: 'audio' }
          });

          if (error) throw error;

          if (data?.text && onTextUpdate) {
            onTextUpdate(data.text);
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          toast.error('Failed to process recording');
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
