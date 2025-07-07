
import { useRef } from "react";
import { VideoPreview } from "./VideoPreview";
import { useDaily } from "./hooks/useDaily";
import { VideoCallFrameProps } from "./types";

export const VideoCallFrame = ({
  onJoinMeeting,
  onParticipantJoined,
  onParticipantLeft,
  onLeaveMeeting,
  onRecordingStarted,
  onCallFrameReady,
  roomUrl,
}: VideoCallFrameProps) => {
  const callFrameRef = useRef<any>(null);
  
  // Only use useDaily hook if no roomUrl is provided
  const {
    handleCallFrameReady,
    ROOM_URL,
  } = useDaily(
    onJoinMeeting,
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStarted,
    onLeaveMeeting,
    !!roomUrl // Skip room creation if we already have a roomUrl
  );

  // Use provided room URL or fallback to useDaily's room URL
  const finalRoomUrl = roomUrl || ROOM_URL;

  const handleFrameReady = (frame: any) => {
    callFrameRef.current = frame;
    handleCallFrameReady(frame);
    if (onCallFrameReady) {
      onCallFrameReady(frame);
    }
  };

  console.log("VideoCallFrame rendering with room URL:", finalRoomUrl);

  return (
    <div className="absolute inset-0" style={{ minHeight: '600px' }}>
      <VideoPreview 
        onCallFrameReady={handleFrameReady} 
        roomUrl={finalRoomUrl}
      />
    </div>
  );
};
