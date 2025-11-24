
import { useState, useRef, useEffect } from "react";
import { VideoCallFrame } from "@/components/video/VideoCallFrame";
import { TranscriptionProcessor } from "@/components/video/TranscriptionProcessor";
import { MeetingDataManager } from "@/components/video/MeetingDataManager";
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
import { ContextBar } from "@/components/context/ContextBar";
import { useContextIntegration } from "@/hooks/useContextIntegration";
import { useProjectContext } from "@/context/ProjectContext";
import { useNewAuth } from "@/context/NewAuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  
  const { sessionId } = useScreeningSession();
  useWebSocket(sessionId);
  const { user, isLoading, isAuthenticated } = useNewAuth();

  // Context integration for file uploads, web scraping, and AI search
  const {
    processContent,
    sendToWebSocket,
    isProcessing: isContextProcessing,
    isWebSocketConnected
  } = useContextIntegration({
    context: 'screening',
    sessionId: sessionId || undefined,
    enableRealTime: true
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to access the screening room');
      navigate('/');
    }

    // Set document title
    document.title = "Screening Room | Pipecat";
    
    return () => {
      document.title = "Pipecat"; // Reset title on unmount
    };
  }, [isLoading, isAuthenticated, navigate]);

  const handleJoinMeeting = () => {
    console.log('Joined meeting');
    toast.success('Welcome to the screening room! Your camera and microphone should start automatically.');
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
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const sessionRef = doc(db, 'chat_sessions', sessionId);
        await updateDoc(sessionRef, { status: 'completed' });
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
  if (isLoading || !isAuthenticated) {
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
      
      {/* Context Bar with Project Selector and Context Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <ContextBar
          context="screening"
          title="Screening Context & Project"
          description="Select a project and add context for your screening session through uploads, web scraping, or AI search"
          onContentProcessed={async (content) => {
            try {
              // Process with orchestration
              await processContent(content);
              
              // Send to WebSocket for real-time processing if connected
              if (isWebSocketConnected && sessionId) {
                await sendToWebSocket(content);
              }
              
              // Add to uploaded files for display
              setUploadedFiles(prev => [...prev, {
                name: content.metadata?.filename || `${content.type} content`,
                content: content.text,
                type: content.type,
                size: content.text.length,
              }]);
              
              toast.success(`${content.type} content processed and ready for screening`);
            } catch (error) {
              console.error('Screening context processing error:', error);
            }
          }}
          projectSelectorProps={{
            label: "Select project for this screening session",
            placeholder: "Choose a project (optional)",
            className: "max-w-md"
          }}
          showLabels={true}
          size="default"
          layout="stacked"
          className="max-w-4xl"
        />
        
        {/* Real-time status indicator */}
        {isWebSocketConnected && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time AI processing enabled</span>
          </div>
        )}
        
        {/* Show uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Context Files Ready:</h4>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm">
                  <span>{file.name}</span>
                  <span className="px-2 py-0.5 bg-green-100 rounded text-xs">{file.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
