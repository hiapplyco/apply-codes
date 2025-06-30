
import { useState, useRef, useEffect } from "react";
import { VideoCallFrame } from "@/components/video/VideoCallFrame";
import { TranscriptionProcessor } from "@/components/video/TranscriptionProcessor";
import { MeetingDataManager } from "@/components/video/MeetingDataManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ScreeningHeader } from "@/components/screening/ScreeningHeader";
import { ScreeningControls } from "@/components/screening/ScreeningControls";
import { ScreeningChat } from "@/components/screening/ScreeningChat";
import { ScreeningStatus } from "@/components/screening/ScreeningStatus";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useScreeningSession } from "@/hooks/useScreeningSession";
import { Loader2 } from "lucide-react";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { useProjectContext } from "@/context/ProjectContext";

interface Participant {
  id: string;
  name?: string;
}

const ScreeningRoom = () => {
  const navigate = useNavigate();
  const { selectedProjectId } = useProjectContext();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  const [whisperTranscript, setWhisperTranscript] = useState<string>("");
  const transcriptionProcessor = TranscriptionProcessor();
  const meetingDataManager = MeetingDataManager(selectedProjectId);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { sessionId } = useScreeningSession();
  useWebSocket(sessionId);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        toast.error('Please sign in to access the screening room');
        navigate('/');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Set document title
    document.title = "Screening Room | Pipecat";
    
    return () => {
      document.title = "Pipecat"; // Reset title on unmount
    };
  }, [navigate]);

  const handleJoinMeeting = () => {
    console.log('Joined meeting');
    toast.success('Welcome to the screening room! Your camera and microphone should start automatically.');
    setIsLoading(false);
    setHasJoinedMeeting(true);
  };

  const handleParticipantJoined = (participant: Participant) => {
    setParticipants(prev => [...prev, participant]);
    toast.info(`${participant.name || 'A new participant'} joined the meeting`);
  };

  const handleParticipantLeft = (participant: { id: string }) => {
    setParticipants(prev => prev.filter(p => p.id !== participant.id));
  };

  const handleLeaveMeeting = async () => {
    const endTime = new Date();
    try {
      await meetingDataManager.saveMeetingData({
        startTime: startTimeRef.current,
        endTime,
        participants,
        transcription: whisperTranscript
      });

      if (sessionId) {
        await supabase
          .from('chat_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      }

      toast.success('Meeting data saved successfully');
      setHasJoinedMeeting(false);
    } catch (error) {
      console.error('Error saving meeting data:', error);
      toast.error('Failed to save meeting data');
    }
  };

  const handleRecordingStarted = async (recordingId: string) => {
    try {
      setIsRecording(true);
      const transcript = await transcriptionProcessor.processRecording(recordingId);
      setWhisperTranscript(transcript);
      toast.success('Recording started successfully');
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording');
      setIsRecording(false);
    }
  };

  const handleRecordingStopped = () => {
    setIsRecording(false);
    toast.success('Recording saved successfully');
  };

  const handleCallFrameReady = (frame: any) => {
    setCallFrame(frame);
  };

  const handleScreenShare = () => {
    if (!callFrame) {
      toast.error('Video call not ready');
      return;
    }

    callFrame.startScreenShare()
      .then(() => toast.success('Screen sharing started'))
      .catch((error: any) => {
        console.error('Screen sharing error:', error);
        toast.error('Failed to start screen sharing');
      });
  };

  // If still checking auth, show an auth loading screen
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col h-screen">
        <ScreeningHeader />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-[#9b87f5] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Initializing screening room...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen relative">
      <ScreeningHeader />
      
      {/* Project selector */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <ProjectSelector 
          label="Select project for this screening session"
          placeholder="Choose a project (optional)"
          className="max-w-md"
        />
      </div>
      
      {hasJoinedMeeting && (
        <ScreeningStatus 
          startTime={startTimeRef.current}
          participantCount={participants.length}
          isRecording={isRecording}
        />
      )}
      
      <div className="flex-1 relative">
        <VideoCallFrame
          onJoinMeeting={handleJoinMeeting}
          onParticipantJoined={handleParticipantJoined}
          onParticipantLeft={handleParticipantLeft}
          onLeaveMeeting={handleLeaveMeeting}
          onRecordingStarted={handleRecordingStarted}
          onCallFrameReady={handleCallFrameReady}
        />
        
        {hasJoinedMeeting && (
          <ScreeningControls 
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onScreenShare={handleScreenShare}
            callFrame={callFrame}
          />
        )}
      </div>
      
      <ScreeningChat 
        open={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        sessionId={sessionId}
      />
    </div>
  );
};

export default ScreeningRoom;
