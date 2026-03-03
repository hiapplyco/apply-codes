
import { useState, useEffect, useCallback, useRef } from "react";
import { functionBridge } from "@/lib/function-bridge";
import { toast } from "sonner";

// Demo room URL to use as a fallback if everything else fails
const DEMO_ROOM_URL = "https://pipecat.daily.co/hello";

export const useDaily = (
  onJoinMeeting?: () => void,
  onParticipantJoined?: (participant: any) => void,
  onParticipantLeft?: (participant: any) => void,
  onRecordingStarted?: (recordingId: string) => void,
  onLeaveMeeting?: () => void,
  skipRoomCreation?: boolean
) => {
  const [ROOM_URL, setRoomUrl] = useState<string>("");
  const [meetingToken, setMeetingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const meetingTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (skipRoomCreation) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const createRoom = async () => {
      if (cancelled) return;
      try {
        setIsLoading(true);
        const response = await functionBridge.createDailyRoom({
          enableTranscription: true,
        });

        const roomUrl = response?.room?.url || response?.url;
        const token = response?.meetingToken || null;

        if (roomUrl) {
          console.log("Successfully created Daily room:", roomUrl);
          setRoomUrl(roomUrl);
          setMeetingToken(token);
          meetingTokenRef.current = token;
          setUsingFallback(false);
          if (token) {
            console.log("Meeting token received (scoped to room)");
          }
        } else {
          throw new Error('No room URL returned from API');
        }
      } catch (err) {
        console.error('Error creating Daily.co room:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));

        if (retryCount < 2) {
          console.log(`Retrying room creation (attempt ${retryCount + 2}/3)...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => createRoom(), 2000);
        } else {
          toast.error('Failed to create video room after multiple attempts');
          console.log("Using fallback demo room:", DEMO_ROOM_URL);
          setRoomUrl(DEMO_ROOM_URL);
          setUsingFallback(true);
          toast.info("Using demo video room instead");
        }
      } finally {
        setIsLoading(false);
      }
    };

    createRoom();

    return () => {
      cancelled = true;
    };
  }, [retryCount, skipRoomCreation]);

  const handleCallFrameReady = useCallback((callFrame: any) => {
    if (!callFrame) return;

    if (ROOM_URL) {
      // Join with meeting token if available (scoped auth, no raw API key needed)
      const joinOptions: Record<string, unknown> = {};
      if (meetingTokenRef.current) {
        joinOptions.token = meetingTokenRef.current;
      }
      callFrame.join(joinOptions);

      callFrame.on('joined-meeting', (event: any) => {
        console.log('Successfully joined meeting', event);
        if (onJoinMeeting) onJoinMeeting();
      });

      callFrame.on('participant-joined', (event: any) => {
        console.log('Participant joined:', event.participant);
        if (onParticipantJoined) onParticipantJoined(event.participant);
      });

      callFrame.on('participant-left', (event: any) => {
        console.log('Participant left:', event.participant);
        if (onParticipantLeft) onParticipantLeft(event.participant);
      });

      callFrame.on('recording-started', (event: any) => {
        console.log('Recording started:', event);
        if (onRecordingStarted && event.recordingId) {
          onRecordingStarted(event.recordingId);
        }
      });

      callFrame.on('left-meeting', (event: any) => {
        console.log('Left meeting:', event);
        if (onLeaveMeeting) onLeaveMeeting();
      });
    }
  }, [ROOM_URL, onJoinMeeting, onParticipantJoined, onParticipantLeft, onRecordingStarted, onLeaveMeeting]);

  return {
    ROOM_URL,
    meetingToken,
    isLoading,
    error,
    usingFallback,
    handleCallFrameReady,
  };
};
