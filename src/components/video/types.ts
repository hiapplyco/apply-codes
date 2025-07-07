
export interface VideoCallFrameProps {
  onJoinMeeting: () => void;
  onParticipantJoined: (participant: { id: string; name?: string }) => void;
  onParticipantLeft: (participant: { id: string }) => void;
  onLeaveMeeting: () => void;
  onRecordingStarted: (recordingId: string) => void;
  onCallFrameReady?: (callFrame: any) => void;
  roomUrl?: string;
}

export interface VideoPreviewProps {
  onCallFrameReady: (callFrame: any) => void;
  roomUrl: string;
}

export interface MeetingData {
  startTime: Date;
  endTime: Date;
  participants: Array<{ id: string; name?: string }>;
  transcription?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
}
