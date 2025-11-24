import { useRef, useEffect, useCallback } from 'react';
import { functionBridge } from '@/lib/function-bridge';
import { useInterviewStore } from '@/stores/interviewStore';
import { InterviewContextManager } from '@/lib/interviewContextManager';
import type { InterviewContext, TranscriptSegment, InterviewTip } from '@/types/interview';

interface UseInterviewGuidanceOptions {
  sessionId: string;
  meetingId: string;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export const useInterviewGuidance = ({
  sessionId,
  meetingId,
  enabled = true,
  onError,
}: UseInterviewGuidanceOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    setConnectionStatus,
    addTranscript,
    addTip,
    updateCompetencyCoverage,
    context,
    setContext,
    clearOldTranscripts,
  } = useInterviewStore();

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setConnectionStatus('connecting');

      // Get WebSocket URL from edge function
      const response = await functionBridge.initializeInterviewGuidance();
      if (!response?.websocket_url) {
        throw new Error('Interview guidance endpoint not configured');
      }

      const ws = new WebSocket(response.websocket_url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Interview guidance connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Send initial context
        if (context.sessionId) {
          ws.send(JSON.stringify({
            type: 'context_update',
            context: {
              sessionId,
              meetingId,
              ...context,
            },
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Interview guidance WebSocket error:', error);
        setConnectionStatus('error');
        if (onError) onError(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('Interview guidance disconnected');
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting reconnect (${reconnectAttemptsRef.current}/5)`);
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('Failed to initialize interview guidance:', error);
      setConnectionStatus('error');
      if (onError) onError(error as Error);
    }
  }, [enabled, sessionId, meetingId, context, setConnectionStatus, onError, handleWebSocketMessage]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: Record<string, any>) => {
    switch (data.type) {
      case 'tip':
        addTip(data.tip as InterviewTip);
        break;

      case 'coverage_update':
        updateCompetencyCoverage(data.competencyId, data.coverage);
        break;

      case 'coverage_report':
        // Update all competency coverage at once
        data.competencies.forEach((comp: { id: string; coverage: number }) => {
          updateCompetencyCoverage(comp.id, comp.coverage);
        });
        break;

      case 'ack':
        console.log('Acknowledged:', data.action);
        break;

      case 'error':
        console.error('Guidance error:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [addTip, updateCompetencyCoverage]);

  // Send transcript to guidance system
  const sendTranscript = useCallback((speaker: 'interviewer' | 'candidate', text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const transcript: TranscriptSegment = {
      id: crypto.randomUUID(),
      speaker,
      text,
      timestamp: new Date(),
      analyzed: false,
    };

    // Add to local store
    addTranscript(transcript);

    // Send to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'transcript',
      speaker,
      text,
      timestamp: transcript.timestamp.toISOString(),
    }));

    // Clean up old transcripts
    clearOldTranscripts(20);
  }, [addTranscript, clearOldTranscripts]);

  // Update interview context
  const updateContext = useCallback((updates: Partial<InterviewContext>) => {
    setContext(updates);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'context_update',
        context: updates,
      }));
    }
  }, [setContext]);

  // Request specific guidance
  const requestGuidance = useCallback((competencyId?: string, urgency?: 'high' | 'medium' | 'low') => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'guidance_request',
      competencyId,
      urgency: urgency || 'medium',
    }));
  }, []);

  // Check competency coverage
  const checkCoverage = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'competency_check',
    }));
  }, []);

  // Initialize connection
  useEffect(() => {
    if (enabled && sessionId && meetingId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, enabled, sessionId, meetingId]);

  return {
    sendTranscript,
    updateContext,
    requestGuidance,
    checkCoverage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
