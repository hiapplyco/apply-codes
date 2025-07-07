import { useEffect, useCallback, useRef } from 'react';
import { DailyCall, DailyEventObject, DailyTranscriptionType } from '@daily-co/daily-js';
import { useInterviewGuidance } from './useInterviewGuidance';
import { toast } from 'sonner';

interface UseDailyTranscriptionOptions {
  callObject: DailyCall | null;
  sessionId: string;
  meetingId: string;
  enabled?: boolean;
  onTranscript?: (speaker: string, text: string) => void;
  onError?: (error: Error) => void;
}

interface TranscriptBuffer {
  speaker: string;
  text: string;
  timestamp: number;
}

export const useDailyTranscription = ({
  callObject,
  sessionId,
  meetingId,
  enabled = true,
  onTranscript,
  onError,
}: UseDailyTranscriptionOptions) => {
  const { sendTranscript } = useInterviewGuidance({
    sessionId,
    meetingId,
    enabled,
    onError,
  });

  const transcriptBufferRef = useRef<Map<string, TranscriptBuffer>>(new Map());
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Buffer transcripts to avoid sending too many small fragments
  const bufferTranscript = useCallback((participantId: string, text: string, isFinal: boolean) => {
    const buffer = transcriptBufferRef.current.get(participantId);
    
    if (buffer) {
      // Append to existing buffer
      buffer.text += ' ' + text;
      buffer.timestamp = Date.now();
    } else {
      // Create new buffer
      transcriptBufferRef.current.set(participantId, {
        speaker: participantId === 'local' ? 'interviewer' : 'candidate',
        text,
        timestamp: Date.now(),
      });
    }

    // If final transcript or buffer is getting long, flush it
    if (isFinal || text.length > 100) {
      flushTranscriptBuffer(participantId);
    } else {
      // Set timer to flush after pause in speech
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = setTimeout(() => {
        flushAllBuffers();
      }, 1000); // 1 second pause
    }
  }, []);

  // Flush a specific participant's buffer
  const flushTranscriptBuffer = useCallback((participantId: string) => {
    const buffer = transcriptBufferRef.current.get(participantId);
    if (!buffer || !buffer.text.trim()) return;

    const speaker = buffer.speaker as 'interviewer' | 'candidate';
    const text = buffer.text.trim();

    // Send to guidance system
    sendTranscript(speaker, text);

    // Call optional callback
    if (onTranscript) {
      onTranscript(speaker, text);
    }

    // Clear buffer
    transcriptBufferRef.current.delete(participantId);
  }, [sendTranscript, onTranscript]);

  // Flush all buffers
  const flushAllBuffers = useCallback(() => {
    transcriptBufferRef.current.forEach((_, participantId) => {
      flushTranscriptBuffer(participantId);
    });
  }, [flushTranscriptBuffer]);

  // Start transcription
  const startTranscription = useCallback(async () => {
    if (!callObject || !enabled) return;

    try {
      // Check if transcription is supported
      const { transcription } = callObject.getLocalParticipant();
      
      if (!transcription) {
        // Start transcription
        await callObject.startTranscription({
          model: 'whisper',
          language: 'en',
          profanity_filter: false,
          redact: false,
          endpointing: true,
          punctuate: true,
          includeRawResponse: false,
          extra: {
            interim_results: true,
          },
        });

        toast.success('Transcription started');
      }
    } catch (error) {
      console.error('Failed to start transcription:', error);
      if (onError) onError(error as Error);
      toast.error('Failed to start transcription');
    }
  }, [callObject, enabled, onError]);

  // Stop transcription
  const stopTranscription = useCallback(async () => {
    if (!callObject) return;

    try {
      // Flush any remaining buffers
      flushAllBuffers();

      // Stop transcription
      await callObject.stopTranscription();
      toast.info('Transcription stopped');
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  }, [callObject, flushAllBuffers]);

  // Handle transcription events
  useEffect(() => {
    if (!callObject || !enabled) return;

    const handleTranscriptionStarted = (event: DailyEventObject) => {
      console.log('Transcription started:', event);
      toast.success('Live transcription active');
    };

    const handleTranscriptionStopped = (event: DailyEventObject) => {
      console.log('Transcription stopped:', event);
      flushAllBuffers();
    };

    const handleTranscriptionError = (event: DailyEventObject) => {
      console.error('Transcription error:', event);
      if (onError) onError(new Error('Transcription error'));
      toast.error('Transcription error occurred');
    };

    const handleTranscriptionMessage = (event: DailyEventObject) => {
      if (!event.data) return;

      const { participant_id, text, is_final } = event.data;
      
      if (text && participant_id) {
        bufferTranscript(participant_id, text, is_final);
      }
    };

    // Subscribe to events
    callObject.on('transcription-started', handleTranscriptionStarted);
    callObject.on('transcription-stopped', handleTranscriptionStopped);
    callObject.on('transcription-error', handleTranscriptionError);
    callObject.on('transcription-message', handleTranscriptionMessage);

    // Auto-start transcription when joining
    const handleJoinedMeeting = () => {
      setTimeout(() => {
        startTranscription();
      }, 2000); // Delay to ensure meeting is fully joined
    };

    callObject.on('joined-meeting', handleJoinedMeeting);

    // Cleanup
    return () => {
      callObject.off('transcription-started', handleTranscriptionStarted);
      callObject.off('transcription-stopped', handleTranscriptionStopped);
      callObject.off('transcription-error', handleTranscriptionError);
      callObject.off('transcription-message', handleTranscriptionMessage);
      callObject.off('joined-meeting', handleJoinedMeeting);

      // Clear any pending timers
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, [callObject, enabled, bufferTranscript, flushAllBuffers, startTranscription, onError]);

  return {
    startTranscription,
    stopTranscription,
  };
};