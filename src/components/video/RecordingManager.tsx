import { toast } from "sonner";

interface RecordingManagerProps {
  callFrame: any;
  isCallFrameReady: boolean;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const RecordingManager = ({
  callFrame,
  isCallFrameReady,
  isRecording,
  setIsRecording
}: RecordingManagerProps) => {
  const startRecording = async () => {
    try {
      if (!callFrame || !isCallFrameReady) {
        console.error('Call frame not ready for recording');
        toast.error('Video call not ready for recording');
        return;
      }

      console.log('Starting recording...');
      
      // Check if recording is already in progress
      if (isRecording) {
        console.log('Recording already in progress');
        return;
      }

      const response = await callFrame.startRecording({
        layout: {
          preset: "active-participant",
          max_cam_streams: 25,
          screen_share_mode: "crop"
        },
        width: 1920,
        height: 1080,
        backgroundColor: "#2C1810", // Match our dark brown theme
        cloudMode: "cloud-beta", // Use cloud-beta for more reliable cloud recording
        streamMode: "automatic",
        recordOnStart: true,
        startAudioOnly: false,
        maxRecordingDuration: 14400, // 4 hours max
      });
      
      console.log('Recording started:', response);
      
      if (response?.recordingId) {
        setIsRecording(true);
        toast.success('Recording started successfully');
      } else {
        throw new Error('No recording ID received');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!callFrame || !isRecording) {
        console.log('No active recording to stop');
        return;
      }

      console.log('Stopping recording...');
      await callFrame.stopRecording();
      setIsRecording(false);
      toast.success('Recording stopped successfully');
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  };

  return { startRecording, stopRecording };
};
