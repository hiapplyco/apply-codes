/**
 * useWorkflowRun Hook
 *
 * Manages the complete state for a single job description + boolean search workflow run.
 * All state is scoped to a runId and automatically cleared when starting a new run.
 *
 * KEY FEATURES:
 * - Per-run session scope (no sticky state between sessions)
 * - Automatic boolean generation after job description
 * - Re-roll with history-based deduplication
 * - Clean reset when starting new workflow
 */

import { useState, useCallback, useRef } from 'react';
import {
  WorkflowRunState,
  BooleanState,
  BooleanHistoryEntry,
  BooleanExplanation,
  JobContext,
  GenerateBooleanPayload,
  createNewWorkflowRun,
  createDefaultBooleanState,
  templateToJobContext,
  validateJobContextForBoolean,
} from './workflowTypes';
import { ClarvidaJobTemplate } from '@/types/organization';
import { ContextItem } from './types';
import { functionBridge } from '@/lib/function-bridge';
import { toast } from 'sonner';

interface UseWorkflowRunOptions {
  autoGenerateBoolean?: boolean;
  onWorkflowComplete?: (state: WorkflowRunState) => void;
}

export function useWorkflowRun(options: UseWorkflowRunOptions = {}) {
  const { autoGenerateBoolean = true, onWorkflowComplete } = options;

  // Initialize with fresh workflow state
  const [workflowState, setWorkflowState] = useState<WorkflowRunState>(createNewWorkflowRun);

  // Track the current run ID for cleanup
  const currentRunIdRef = useRef<string>(workflowState.runId);

  // Ref to avoid stale closures for contextItems in setTimeout callbacks
  const contextItemsRef = useRef(workflowState.contextItems);
  contextItemsRef.current = workflowState.contextItems;

  /**
   * Start a completely new workflow run
   * Clears ALL previous state - no sticky data
   */
  const startNewRun = useCallback(() => {
    const newState = createNewWorkflowRun();
    currentRunIdRef.current = newState.runId;
    setWorkflowState(newState);
    toast.success('Started new job workflow');
    return newState.runId;
  }, []);

  /**
   * Update job context from template
   */
  const setJobContextFromTemplate = useCallback((template: Partial<ClarvidaJobTemplate>) => {
    const jobContext = templateToJobContext(template);
    setWorkflowState(prev => ({
      ...prev,
      jobContext,
      jobTemplate: template as ClarvidaJobTemplate,
      isDirty: true,
    }));
    return jobContext;
  }, []);

  /**
   * Set the generated job description and trigger boolean generation
   */
  const setGeneratedDescription = useCallback(async (description: string, template: ClarvidaJobTemplate) => {
    const jobContext = templateToJobContext(template);

    // Update state first
    setWorkflowState(prev => ({
      ...prev,
      generatedDescription: description,
      jobTemplate: template,
      jobContext,
      currentStep: 'description',
      isDirty: true,
    }));

    // If auto-generation is enabled, trigger boolean generation directly
    // This avoids stale closure issues with useEffect
    if (autoGenerateBoolean && jobContext.title) {
      // Small delay to ensure state is updated
      setTimeout(async () => {
        try {
          // Set generating state and clear previous error
          setWorkflowState(prev => ({
            ...prev,
            booleanState: { ...prev.booleanState, isGenerating: true, error: null },
          }));

          // Get current context items from ref (avoids stale closure)
          const currentContextItems = contextItemsRef.current;

          const payload: GenerateBooleanPayload = {
            jobContext,
            generatedDescription: description,
            contextItems: currentContextItems.length > 0 ? currentContextItems : undefined,
            previousGenerations: [],
            variant: 'balanced',
            isReroll: false,
          };

          const result = await functionBridge.generateSophisticatedBoolean(payload);

          if (result.success && result.searchString) {
            const historyEntry: BooleanHistoryEntry = {
              id: crypto.randomUUID(),
              searchString: result.searchString,
              variant: 'balanced',
              generatedAt: new Date().toISOString(),
              isReroll: false,
            };

            setWorkflowState(prev => ({
              ...prev,
              booleanState: {
                current: result.searchString!,
                history: [historyEntry],
                isGenerating: false,
                lastGeneratedAt: historyEntry.generatedAt,
                variant: 'balanced',
                explanation: result.explanation as BooleanExplanation | undefined,
                error: null,
              },
              currentStep: 'boolean',
            }));
            toast.success('Boolean search generated!');
          } else {
            throw new Error(result.error || 'Failed to generate');
          }
        } catch (error) {
          console.error('Auto boolean generation failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Generation failed';
          setWorkflowState(prev => ({
            ...prev,
            booleanState: { ...prev.booleanState, isGenerating: false, error: errorMessage },
          }));
          toast.error('Boolean generation failed - you can try re-rolling');
        }
      }, 100);
    }
  }, [autoGenerateBoolean]);

  /**
   * Add context item
   */
  const addContextItem = useCallback((item: ContextItem) => {
    setWorkflowState(prev => ({
      ...prev,
      contextItems: [...prev.contextItems, item],
      isDirty: true,
    }));
  }, []);

  /**
   * Remove context item
   */
  const removeContextItem = useCallback((itemId: string) => {
    setWorkflowState(prev => ({
      ...prev,
      contextItems: prev.contextItems.filter(item => item.id !== itemId),
      isDirty: true,
    }));
  }, []);

  /**
   * Generate sophisticated boolean search string
   */
  const generateBoolean = useCallback(async (
    variant: 'strict' | 'balanced' | 'broad' = 'balanced',
    isReroll: boolean = false,
    _retryDepth: number = 0
  ): Promise<string | null> => {
    const state = workflowState;

    if (!state.jobContext || !state.generatedDescription) {
      toast.error('Generate a job description first');
      return null;
    }

    // Validate job context
    const validation = validateJobContextForBoolean(state.jobContext);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return null;
    }

    // Start generation - clear previous error
    setWorkflowState(prev => ({
      ...prev,
      booleanState: {
        ...prev.booleanState,
        isGenerating: true,
        error: null,
      },
    }));

    try {
      // Prepare payload with history for deduplication and context items
      const payload: GenerateBooleanPayload = {
        jobContext: state.jobContext,
        generatedDescription: state.generatedDescription,
        contextItems: state.contextItems.length > 0 ? state.contextItems : undefined,
        previousGenerations: isReroll ? state.booleanState.history.map(h => h.searchString) : [],
        variant,
        isReroll,
      };

      // Call the generation function
      const result = await functionBridge.generateSophisticatedBoolean(payload);

      if (!result.success || !result.searchString) {
        throw new Error(result.error || 'Failed to generate boolean search');
      }

      // Check for duplicate (shouldn't happen with backend dedup, but double-check)
      const isDuplicate = state.booleanState.history.some(
        h => normalizeBoolean(h.searchString) === normalizeBoolean(result.searchString!)
      );

      if (isDuplicate && isReroll && _retryDepth < 2) {
        toast.warning('Generated similar boolean, trying different variation...');
        const nextVariant = variant === 'balanced' ? 'broad' : variant === 'broad' ? 'strict' : 'balanced';
        return generateBoolean(nextVariant, true, _retryDepth + 1);
      }

      // Create history entry
      const historyEntry: BooleanHistoryEntry = {
        id: crypto.randomUUID(),
        searchString: result.searchString,
        variant,
        generatedAt: new Date().toISOString(),
        isReroll,
      };

      // Update state with new boolean (clear any previous error)
      setWorkflowState(prev => ({
        ...prev,
        booleanState: {
          current: result.searchString!,
          history: [...prev.booleanState.history, historyEntry],
          isGenerating: false,
          lastGeneratedAt: historyEntry.generatedAt,
          variant,
          explanation: result.explanation as BooleanExplanation | undefined,
          error: null,
        },
        currentStep: 'boolean',
      }));

      const message = isReroll ? 'Generated new boolean variation' : 'Boolean search generated';
      toast.success(message);

      return result.searchString;
    } catch (error) {
      console.error('Boolean generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate boolean search';
      setWorkflowState(prev => ({
        ...prev,
        booleanState: {
          ...prev.booleanState,
          isGenerating: false,
          error: errorMessage,
        },
      }));
      toast.error(errorMessage);
      return null;
    }
  }, [workflowState]);

  /**
   * Re-roll boolean with history-aware deduplication
   */
  const rerollBoolean = useCallback(async (
    variant?: 'strict' | 'balanced' | 'broad'
  ): Promise<string | null> => {
    const currentVariant = variant || workflowState.booleanState.variant;
    return generateBoolean(currentVariant, true);
  }, [generateBoolean, workflowState.booleanState.variant]);

  /**
   * Set boolean variant and regenerate
   */
  const setBooleanVariant = useCallback(async (
    variant: 'strict' | 'balanced' | 'broad'
  ): Promise<string | null> => {
    return generateBoolean(variant, false);
  }, [generateBoolean]);

  /**
   * Get previous boolean from history
   */
  const getPreviousBoolean = useCallback((index: number): BooleanHistoryEntry | null => {
    const history = workflowState.booleanState.history;
    if (index < 0 || index >= history.length) return null;
    return history[history.length - 1 - index];
  }, [workflowState.booleanState.history]);

  /**
   * Restore a previous boolean from history
   */
  const restoreFromHistory = useCallback((historyId: string) => {
    const entry = workflowState.booleanState.history.find(h => h.id === historyId);
    if (entry) {
      setWorkflowState(prev => ({
        ...prev,
        booleanState: {
          ...prev.booleanState,
          current: entry.searchString,
          variant: entry.variant,
        },
      }));
      toast.success('Restored previous boolean search');
    }
  }, [workflowState.booleanState.history]);

  /**
   * Restore full workflow state from a saved history item
   */
  const restoreFromSavedWorkflow = useCallback((saved: {
    runId?: string;
    jobTitle?: string;
    jobDepartment?: string;
    jobLocation?: string;
    generatedDescription?: string;
    booleanSearchString?: string;
    booleanVariant?: 'strict' | 'balanced' | 'broad';
    booleanExplanation?: any;
    booleanHistory?: BooleanHistoryEntry[];
  }) => {
    // Parse location from "City, State" format
    const locationParts = (saved.jobLocation || '').split(',').map(s => s.trim());

    const restoredState: WorkflowRunState = {
      runId: saved.runId || crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      currentStep: saved.booleanSearchString ? 'boolean' : saved.generatedDescription ? 'description' : 'context',
      contextItems: [],
      jobContext: saved.jobTitle ? {
        title: saved.jobTitle,
        department: saved.jobDepartment || undefined,
        location: {
          city: locationParts[0] || '',
          state: locationParts[1] || '',
          workArrangement: 'on-site',
        },
        employmentType: 'full-time',
        responsibilities: [],
        mustHaveSkills: [],
        niceToHaveSkills: [],
        technicalSkills: [],
        certifications: [],
        licensure: [],
        keywords: [],
      } : null,
      generatedDescription: saved.generatedDescription || null,
      jobTemplate: null,
      booleanState: {
        current: saved.booleanSearchString || null,
        history: saved.booleanHistory || [],
        isGenerating: false,
        lastGeneratedAt: null,
        variant: saved.booleanVariant || 'balanced',
        explanation: saved.booleanExplanation || undefined,
        error: null,
      },
      isDirty: false,
      hasUnsavedChanges: false,
    };

    currentRunIdRef.current = restoredState.runId;
    setWorkflowState(restoredState);
    toast.success(`Restored workflow: ${saved.jobTitle || 'Untitled'}`);
  }, []);

  /**
   * Mark workflow as complete
   */
  const completeWorkflow = useCallback(() => {
    setWorkflowState(prev => {
      const completedState = {
        ...prev,
        completedAt: new Date().toISOString(),
        currentStep: 'complete' as const,
        hasUnsavedChanges: false,
      };
      onWorkflowComplete?.(completedState);
      return completedState;
    });
  }, [onWorkflowComplete]);

  /**
   * Check if we can generate boolean
   */
  const canGenerateBoolean = Boolean(
    workflowState.generatedDescription && workflowState.jobContext?.title
  );

  // NOTE: Auto-generation now happens directly in setGeneratedDescription
  // This avoids stale closure issues with useEffect dependencies

  return {
    // State
    runId: workflowState.runId,
    currentStep: workflowState.currentStep,
    contextItems: workflowState.contextItems,
    jobContext: workflowState.jobContext,
    generatedDescription: workflowState.generatedDescription,
    jobTemplate: workflowState.jobTemplate,
    booleanState: workflowState.booleanState,
    isDirty: workflowState.isDirty,

    // Workflow control
    startNewRun,
    completeWorkflow,
    restoreFromSavedWorkflow,

    // Context management
    addContextItem,
    removeContextItem,

    // Job description
    setGeneratedDescription,
    setJobContextFromTemplate,

    // Boolean generation
    generateBoolean,
    rerollBoolean,
    setBooleanVariant,
    canGenerateBoolean,
    getPreviousBoolean,
    restoreFromHistory,

    // Raw state access (for debugging)
    _rawState: workflowState,
  };
}

/**
 * Normalize boolean string for comparison
 * Removes whitespace variations and normalizes operators
 */
function normalizeBoolean(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+and\s+/g, ' AND ')
    .replace(/\s+or\s+/g, ' OR ')
    .replace(/\s+not\s+/g, ' NOT ')
    .trim();
}

export type UseWorkflowRunReturn = ReturnType<typeof useWorkflowRun>;
