/**
 * useWorkflowHistory Hook
 *
 * Manages Firestore persistence for Clarvida workflow runs.
 * Follows production guidelines: No fallbacks, explicit error handling.
 */

import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { normalizeTimestamp } from '@/lib/timestamp';
import { WorkflowRunState, BooleanHistoryEntry } from '@/components/clarvida/ContextBuilder/workflowTypes';

/**
 * Persisted workflow run record
 */
export interface WorkflowHistoryItem {
  id: string;
  runId: string;
  userId: string;
  organizationId: string;

  // Job context
  jobTitle: string;
  jobDepartment: string;
  jobLocation: string;

  // Generated content
  generatedDescription: string;
  booleanSearchString: string;
  booleanVariant: 'strict' | 'balanced' | 'broad';
  booleanExplanation?: any;

  // History
  booleanHistory: BooleanHistoryEntry[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  isFavorite: boolean;
  tags: string[];
}

interface UseWorkflowHistoryOptions {
  userId: string | undefined;
  organizationId: string | undefined;
  pageSize?: number;
}

interface UseWorkflowHistoryReturn {
  workflowHistory: WorkflowHistoryItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  saving: boolean;

  // Actions
  fetchHistory: () => Promise<WorkflowHistoryItem[]>;
  loadMore: () => Promise<void>;
  saveWorkflow: (state: WorkflowRunState) => Promise<string | null>;
  updateWorkflow: (id: string, updates: Partial<WorkflowHistoryItem>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  toggleFavorite: (id: string, currentStatus: boolean) => Promise<void>;
  getWorkflowById: (id: string) => Promise<WorkflowHistoryItem | null>;
  refresh: () => Promise<WorkflowHistoryItem[]>;
}

const COLLECTION_NAME = 'clarvida_workflows';

export function useWorkflowHistory({
  userId,
  organizationId,
  pageSize = 25,
}: UseWorkflowHistoryOptions): UseWorkflowHistoryReturn {
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  /**
   * Fetch workflow history from Firestore
   */
  const fetchHistory = useCallback(async (isLoadMore = false): Promise<WorkflowHistoryItem[]> => {
    if (!userId || !organizationId || !db) {
      console.error('[useWorkflowHistory] Cannot fetch: missing userId, organizationId, or db', {
        userId: !!userId,
        organizationId: !!organizationId,
        db: !!db,
      });
      return [];
    }

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      }

      // Build query with organization scope
      const queryConstraints = [
        where('organizationId', '==', organizationId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ];

      if (isLoadMore && lastDoc) {
        queryConstraints.push(startAfter(lastDoc) as any);
      }

      const workflowQuery = query(
        collection(db, COLLECTION_NAME),
        ...queryConstraints
      );

      const snapshot = await getDocs(workflowQuery);

      // Update pagination state
      setHasMore(snapshot.docs.length === pageSize);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      const history = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          runId: data.runId,
          userId: data.userId,
          organizationId: data.organizationId,
          jobTitle: data.jobTitle || '',
          jobDepartment: data.jobDepartment || '',
          jobLocation: data.jobLocation || '',
          generatedDescription: data.generatedDescription || '',
          booleanSearchString: data.booleanSearchString || '',
          booleanVariant: data.booleanVariant || 'balanced',
          booleanExplanation: data.booleanExplanation,
          booleanHistory: data.booleanHistory || [],
          createdAt: normalizeTimestamp(data.createdAt),
          updatedAt: normalizeTimestamp(data.updatedAt),
          completedAt: data.completedAt ? normalizeTimestamp(data.completedAt) : null,
          isFavorite: data.isFavorite || false,
          tags: data.tags || [],
        } as WorkflowHistoryItem;
      });

      if (isLoadMore) {
        setWorkflowHistory((prev) => [...prev, ...history]);
      } else {
        setWorkflowHistory(history);
      }

      return history;
    } catch (error) {
      console.error('[useWorkflowHistory] fetchHistory failed:', {
        error,
        userId,
        organizationId,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to load workflow history. Please try again.');
      return [];
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, organizationId, pageSize, lastDoc]);

  /**
   * Load more history items
   */
  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await fetchHistory(true);
    }
  }, [loadingMore, hasMore, fetchHistory]);

  /**
   * Save a workflow run to Firestore
   */
  const saveWorkflow = useCallback(async (state: WorkflowRunState): Promise<string | null> => {
    if (!userId || !organizationId || !db) {
      console.error('[useWorkflowHistory] Cannot save: missing userId, organizationId, or db');
      toast.error('Unable to save workflow. Please sign in again.');
      return null;
    }

    if (!state.generatedDescription || !state.booleanState.current) {
      console.error('[useWorkflowHistory] Cannot save: missing required data');
      toast.error('Cannot save incomplete workflow. Generate a boolean search first.');
      return null;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const workflowDoc = {
        runId: state.runId,
        userId,
        organizationId,

        // Job context
        jobTitle: state.jobContext?.title || '',
        jobDepartment: state.jobContext?.department || '',
        jobLocation: state.jobContext?.location
          ? `${state.jobContext.location.city || ''}, ${state.jobContext.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
          : '',

        // Generated content
        generatedDescription: state.generatedDescription,
        booleanSearchString: state.booleanState.current,
        booleanVariant: state.booleanState.variant,
        booleanExplanation: state.booleanState.explanation || null,

        // History
        booleanHistory: state.booleanState.history,

        // Metadata
        createdAt: state.startedAt || now,
        updatedAt: now,
        completedAt: state.completedAt || null,
        isFavorite: false,
        tags: [],
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), workflowDoc);

      // Add to local state
      const newItem: WorkflowHistoryItem = {
        id: docRef.id,
        ...workflowDoc,
      };
      setWorkflowHistory((prev) => [newItem, ...prev]);

      toast.success('Workflow saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('[useWorkflowHistory] saveWorkflow failed:', {
        error,
        runId: state.runId,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to save workflow. Please try again.');
      return null;
    } finally {
      setSaving(false);
    }
  }, [userId, organizationId]);

  /**
   * Update a workflow record
   */
  const updateWorkflow = useCallback(async (
    id: string,
    updates: Partial<WorkflowHistoryItem>
  ): Promise<void> => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      const workflowRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(workflowRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setWorkflowHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );

      toast.success('Workflow updated');
    } catch (error) {
      console.error('[useWorkflowHistory] updateWorkflow failed:', {
        error,
        id,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to update workflow. Please try again.');
    }
  }, []);

  /**
   * Delete a workflow record
   */
  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));

      // Update local state
      setWorkflowHistory((prev) => prev.filter((item) => item.id !== id));

      toast.success('Workflow deleted');
    } catch (error) {
      console.error('[useWorkflowHistory] deleteWorkflow failed:', {
        error,
        id,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to delete workflow. Please try again.');
    }
  }, []);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (
    id: string,
    currentStatus: boolean
  ): Promise<void> => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      const workflowRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(workflowRef, {
        isFavorite: !currentStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setWorkflowHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: !currentStatus } : item
        )
      );

      toast.success(currentStatus ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('[useWorkflowHistory] toggleFavorite failed:', {
        error,
        id,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to update favorite status. Please try again.');
    }
  }, []);

  /**
   * Get a single workflow by ID
   */
  const getWorkflowById = useCallback(async (id: string): Promise<WorkflowHistoryItem | null> => {
    if (!db) {
      console.error('[useWorkflowHistory] Cannot get workflow: db not initialized');
      return null;
    }

    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        runId: data.runId,
        userId: data.userId,
        organizationId: data.organizationId,
        jobTitle: data.jobTitle || '',
        jobDepartment: data.jobDepartment || '',
        jobLocation: data.jobLocation || '',
        generatedDescription: data.generatedDescription || '',
        booleanSearchString: data.booleanSearchString || '',
        booleanVariant: data.booleanVariant || 'balanced',
        booleanExplanation: data.booleanExplanation,
        booleanHistory: data.booleanHistory || [],
        createdAt: normalizeTimestamp(data.createdAt),
        updatedAt: normalizeTimestamp(data.updatedAt),
        completedAt: data.completedAt ? normalizeTimestamp(data.completedAt) : null,
        isFavorite: data.isFavorite || false,
        tags: data.tags || [],
      } as WorkflowHistoryItem;
    } catch (error) {
      console.error('[useWorkflowHistory] getWorkflowById failed:', {
        error,
        id,
        timestamp: new Date().toISOString(),
      });
      toast.error('Failed to load workflow. Please try again.');
      return null;
    }
  }, []);

  /**
   * Refresh the workflow history
   */
  const refresh = useCallback(async () => {
    return fetchHistory(false);
  }, [fetchHistory]);

  return {
    workflowHistory,
    loading,
    loadingMore,
    hasMore,
    saving,
    fetchHistory: () => fetchHistory(false),
    loadMore,
    saveWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleFavorite,
    getWorkflowById,
    refresh,
  };
}
