import { useRef, useEffect, useCallback } from 'react';
import type { InterviewCompetency } from '@/types/interview';
import type { AnalysisRequest, AnalysisResponse } from '@/workers/interviewAnalysis.worker';

interface UseInterviewAnalysisWorkerOptions {
  onAnalysisComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useInterviewAnalysisWorker = ({
  onAnalysisComplete,
  onError,
}: UseInterviewAnalysisWorkerOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (result: any) => void>>(new Map());

  // Initialize worker
  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/interviewAnalysis.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<AnalysisResponse>) => {
      const { type, result, error } = event.data;

      if (error) {
        console.error('Worker error:', error);
        if (onError) onError(error);
        return;
      }

      // Call pending callback if exists
      const callback = pendingCallbacksRef.current.get(type);
      if (callback) {
        callback(result);
        pendingCallbacksRef.current.delete(type);
      }

      // Call general callback
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    };

    // Handle worker errors
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      if (onError) onError(error.message);
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onAnalysisComplete, onError]);

  // Analyze transcript for competency mentions
  const analyzeTranscript = useCallback(
    (transcript: string, competencies: InterviewCompetency[]): Promise<{
      mentionedCompetencies: Array<[string, number]>;
      keywords: string[];
    }> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const request: AnalysisRequest = {
          type: 'analyze_transcript',
          data: { transcript, competencies },
        };

        // Store callback
        pendingCallbacksRef.current.set('analyze_transcript', resolve);

        // Send request to worker
        workerRef.current.postMessage(request);

        // Timeout after 5 seconds
        setTimeout(() => {
          if (pendingCallbacksRef.current.has('analyze_transcript')) {
            pendingCallbacksRef.current.delete('analyze_transcript');
            reject(new Error('Analysis timeout'));
          }
        }, 5000);
      });
    },
    []
  );

  // Calculate coverage score for a competency
  const calculateCoverage = useCallback(
    (
      competencyId: string,
      transcripts: Array<{ text: string; speaker: string }>,
      competencies: InterviewCompetency[]
    ): Promise<number> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const request: AnalysisRequest = {
          type: 'calculate_coverage',
          data: { competencyId, transcripts, competencies },
        };

        // Store callback
        pendingCallbacksRef.current.set('calculate_coverage', resolve);

        // Send request to worker
        workerRef.current.postMessage(request);

        // Timeout after 5 seconds
        setTimeout(() => {
          if (pendingCallbacksRef.current.has('calculate_coverage')) {
            pendingCallbacksRef.current.delete('calculate_coverage');
            reject(new Error('Coverage calculation timeout'));
          }
        }, 5000);
      });
    },
    []
  );

  // Extract keywords from text
  const extractKeywords = useCallback((text: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const request: AnalysisRequest = {
        type: 'extract_keywords',
        data: { text },
      };

      // Store callback
      pendingCallbacksRef.current.set('extract_keywords', resolve);

      // Send request to worker
      workerRef.current.postMessage(request);

      // Timeout after 2 seconds
      setTimeout(() => {
        if (pendingCallbacksRef.current.has('extract_keywords')) {
          pendingCallbacksRef.current.delete('extract_keywords');
          reject(new Error('Keyword extraction timeout'));
        }
      }, 2000);
    });
  }, []);

  return {
    analyzeTranscript,
    calculateCoverage,
    extractKeywords,
    isReady: !!workerRef.current,
  };
};