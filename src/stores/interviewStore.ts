import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { 
  InterviewContext, 
  TranscriptSegment, 
  InterviewTip, 
  RealtimeInterviewState,
  InterviewCompetency 
} from '@/types/interview';

interface InterviewStore extends RealtimeInterviewState {
  // Actions
  setContext: (context: Partial<InterviewContext>) => void;
  addTranscript: (segment: TranscriptSegment) => void;
  addTip: (tip: InterviewTip) => void;
  removeTip: (tipId: string) => void;
  updateCompetencyCoverage: (competencyId: string, coverage: number) => void;
  setStage: (stage: InterviewContext['stage']) => void;
  setConnectionStatus: (status: RealtimeInterviewState['connectionStatus']) => void;
  setRecording: (isRecording: boolean) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  clearOldTranscripts: (keepCount: number) => void;
  reset: () => void;
}

const initialState: RealtimeInterviewState = {
  context: {
    sessionId: '',
    meetingId: '',
    jobRole: '',
    competencies: [],
    stage: 'intro',
  },
  recentTranscripts: [],
  activeTips: [],
  competencyCoverage: new Map(),
  isRecording: false,
  isTranscribing: false,
  connectionStatus: 'disconnected',
};

export const useInterviewStore = create<InterviewStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        ...initialState,

        setContext: (context) =>
          set((state) => ({
            context: { ...state.context, ...context },
          })),

        addTranscript: (segment) =>
          set((state) => ({
            recentTranscripts: [...state.recentTranscripts, segment],
          })),

        addTip: (tip) =>
          set((state) => {
            // Remove duplicate tips or tips for the same competency
            const filteredTips = state.activeTips.filter(
              (t) => t.competencyId !== tip.competencyId || t.type !== tip.type
            );
            return {
              activeTips: [...filteredTips, tip].sort(
                (a, b) => {
                  // Sort by priority then by timestamp
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  }
                  return b.timestamp.getTime() - a.timestamp.getTime();
                }
              ),
            };
          }),

        removeTip: (tipId) =>
          set((state) => ({
            activeTips: state.activeTips.filter((tip) => tip.id !== tipId),
          })),

        updateCompetencyCoverage: (competencyId, coverage) =>
          set((state) => {
            const newCoverage = new Map(state.competencyCoverage);
            newCoverage.set(competencyId, coverage);
            
            // Update competency in context
            const updatedCompetencies = state.context.competencies.map((comp) =>
              comp.id === competencyId
                ? { ...comp, coverageLevel: coverage, lastCoveredAt: new Date() }
                : comp
            );

            return {
              competencyCoverage: newCoverage,
              context: {
                ...state.context,
                competencies: updatedCompetencies,
              },
            };
          }),

        setStage: (stage) =>
          set((state) => ({
            context: { ...state.context, stage },
          })),

        setConnectionStatus: (connectionStatus) =>
          set({ connectionStatus }),

        setRecording: (isRecording) =>
          set({ isRecording }),

        setTranscribing: (isTranscribing) =>
          set({ isTranscribing }),

        clearOldTranscripts: (keepCount) =>
          set((state) => ({
            recentTranscripts: state.recentTranscripts.slice(-keepCount),
          })),

        reset: () => set(initialState),
      }),
      {
        name: 'interview-store',
      }
    )
  )
);

// Selectors
export const selectUncoveredCompetencies = (state: InterviewStore) =>
  state.context.competencies.filter((comp) => comp.coverageLevel < 30);

export const selectHighPriorityTips = (state: InterviewStore) =>
  state.activeTips.filter((tip) => tip.priority === 'high');

export const selectRecentTranscriptText = (state: InterviewStore, count = 5) =>
  state.recentTranscripts
    .slice(-count)
    .map((t) => `${t.speaker}: ${t.text}`)
    .join('\n');