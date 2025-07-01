import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  InterviewContext,
  InterviewSession,
  TranscriptEntry,
  InterviewAnalysis,
  CompetencyScore,
  InterviewFlag,
  Suggestion,
  InterviewIntelligence,
  ResponseQuality,
  SkillMatch,
} from '@/types/interview';

interface UseInterviewCoPilotProps {
  context: InterviewContext;
  sessionId: string;
  onTranscriptionUpdate?: (entry: TranscriptEntry) => void;
  onAnalysisUpdate?: (analysis: InterviewAnalysis) => void;
  onSuggestion?: (suggestion: Suggestion) => void;
  onFlag?: (flag: InterviewFlag) => void;
}

export function useInterviewCoPilot({
  context,
  sessionId,
  onTranscriptionUpdate,
  onAnalysisUpdate,
  onSuggestion,
  onFlag,
}: UseInterviewCoPilotProps) {
  const [session, setSession] = useState<InterviewSession>({
    id: sessionId,
    startTime: new Date(),
    context,
    transcript: [],
    analysis: {
      competencyCoverage: {},
      responseQuality: [],
      timeManagement: {
        totalDuration: 0,
        categoryBreakdown: {},
        pacing: 'optimal',
        warnings: [],
      },
      skillMatch: {
        requiredSkills: [],
        additionalSkills: [],
        overallMatch: 0,
      },
      overallInsights: [],
    },
    scores: [],
    flags: [],
    suggestions: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const analysisQueueRef = useRef<TranscriptEntry[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  // Process transcript entry with Gemini
  const processTranscriptEntry = useCallback(async (entry: TranscriptEntry) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-interview-transcript', {
        body: {
          context,
          transcript: [...session.transcript, entry],
          currentAnalysis: session.analysis,
        },
      });

      if (error) throw error;

      const {
        intelligence,
        updatedAnalysis,
        newSuggestions,
        newFlags,
        competencyUpdate,
      }: {
        intelligence: InterviewIntelligence;
        updatedAnalysis: Partial<InterviewAnalysis>;
        newSuggestions: Suggestion[];
        newFlags: InterviewFlag[];
        competencyUpdate: Record<string, number>;
      } = data;

      // Update session state
      setSession(prev => ({
        ...prev,
        transcript: [...prev.transcript, entry],
        analysis: {
          ...prev.analysis,
          ...updatedAnalysis,
          competencyCoverage: {
            ...prev.analysis.competencyCoverage,
            ...competencyUpdate,
          },
        },
        suggestions: [...prev.suggestions, ...newSuggestions],
        flags: [...prev.flags, ...newFlags],
      }));

      // Trigger callbacks
      if (onAnalysisUpdate && updatedAnalysis) {
        onAnalysisUpdate({ ...session.analysis, ...updatedAnalysis });
      }

      newSuggestions.forEach(suggestion => {
        if (onSuggestion) onSuggestion(suggestion);
      });

      newFlags.forEach(flag => {
        if (onFlag) onFlag(flag);
      });

      // Handle high-priority suggestions
      const urgentSuggestions = newSuggestions.filter(
        s => s.priority === 'high' && s.timing === 'immediate'
      );
      if (urgentSuggestions.length > 0) {
        toast.info('New interview suggestion available', {
          description: urgentSuggestions[0].text,
          duration: 5000,
        });
      }

      // Handle critical flags
      const criticalFlags = newFlags.filter(
        f => f.type === 'red_flag' && f.severity === 'high'
      );
      if (criticalFlags.length > 0) {
        toast.warning('Important flag detected', {
          description: criticalFlags[0].description,
          duration: 7000,
        });
      }

    } catch (error) {
      console.error('Error processing transcript:', error);
    }
  }, [context, session, onAnalysisUpdate, onSuggestion, onFlag]);

  // Batch process transcript entries
  const batchProcessTranscript = useCallback(() => {
    if (analysisQueueRef.current.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const entriesToProcess = [...analysisQueueRef.current];
    analysisQueueRef.current = [];

    Promise.all(
      entriesToProcess.map(entry => processTranscriptEntry(entry))
    ).finally(() => {
      setIsProcessing(false);
    });
  }, [processTranscriptEntry, isProcessing]);

  // Add transcript entry
  const addTranscriptEntry = useCallback((
    speaker: 'interviewer' | 'candidate',
    text: string
  ) => {
    const entry: TranscriptEntry = {
      timestamp: new Date(),
      speaker,
      text,
    };

    // Add to queue
    analysisQueueRef.current.push(entry);

    // Trigger callback
    if (onTranscriptionUpdate) {
      onTranscriptionUpdate(entry);
    }

    // Clear existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Set new timeout for batch processing
    processingTimeoutRef.current = setTimeout(() => {
      batchProcessTranscript();
    }, 1000); // Process after 1 second of inactivity
  }, [onTranscriptionUpdate, batchProcessTranscript]);

  // Update competency score
  const updateCompetencyScore = useCallback(async (
    competencyId: string,
    score: number,
    evidence: string[],
    humanAdjustment?: { newScore: number; rationale: string }
  ) => {
    const competencyScore: CompetencyScore = {
      competencyId,
      score,
      confidence: 85, // Default confidence
      evidence,
      aiRationale: 'Based on candidate responses and demonstrated skills',
      humanAdjustment,
    };

    setSession(prev => ({
      ...prev,
      scores: [
        ...prev.scores.filter(s => s.competencyId !== competencyId),
        competencyScore,
      ],
    }));

    // Store in database
    try {
      await supabase.from('interview_scores').insert({
        session_id: sessionId,
        competency_id: competencyId,
        score,
        confidence: competencyScore.confidence,
        evidence,
        ai_rationale: competencyScore.aiRationale,
        human_adjustment: humanAdjustment,
      });
    } catch (error) {
      console.error('Error saving competency score:', error);
    }
  }, [sessionId]);

  // Generate interview questions based on context
  const generateQuestions = useCallback(async (
    category: string,
    count: number = 5
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          context,
          category,
          count,
          transcript: session.transcript,
          coveredCompetencies: Object.keys(session.analysis.competencyCoverage),
        },
      });

      if (error) throw error;

      return data.questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate interview questions');
      return [];
    }
  }, [context, session]);

  // Accept suggestion
  const acceptSuggestion = useCallback((suggestion: Suggestion) => {
    // Mark suggestion as accepted
    setSession(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id),
    }));

    // Track acceptance
    supabase.from('interview_events').insert({
      session_id: sessionId,
      event_type: 'suggestion_accepted',
      event_data: { suggestion },
    }).catch(console.error);
  }, [sessionId]);

  // Dismiss flag
  const dismissFlag = useCallback((flag: InterviewFlag) => {
    setSession(prev => ({
      ...prev,
      flags: prev.flags.filter(f => f.id !== flag.id),
    }));

    // Track dismissal
    supabase.from('interview_events').insert({
      session_id: sessionId,
      event_type: 'flag_dismissed',
      event_data: { flag },
    }).catch(console.error);
  }, [sessionId]);

  // End interview and generate report
  const endInterview = useCallback(async () => {
    const endTime = new Date();
    
    try {
      // Generate final analysis
      const { data, error } = await supabase.functions.invoke('generate-interview-report', {
        body: {
          session: {
            ...session,
            endTime,
          },
          context,
        },
      });

      if (error) throw error;

      // Save session to database
      await supabase.from('interview_sessions').insert({
        id: sessionId,
        project_id: context.projectId,
        candidate_name: context.candidateName,
        position: context.position,
        start_time: session.startTime,
        end_time: endTime,
        transcript: session.transcript,
        analysis: session.analysis,
        scores: session.scores,
        report: data.report,
      });

      toast.success('Interview completed and report generated');
      return data.report;
    } catch (error) {
      console.error('Error ending interview:', error);
      toast.error('Failed to generate interview report');
      return null;
    }
  }, [session, context, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  return {
    session,
    addTranscriptEntry,
    updateCompetencyScore,
    generateQuestions,
    acceptSuggestion,
    dismissFlag,
    endInterview,
    isProcessing,
  };
}