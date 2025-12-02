import { useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  documentId,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { toast } from "sonner";
import { normalizeTimestamp } from "@/lib/timestamp";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  candidates_count: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface SearchHistoryItem {
  id: string;
  search_query: string;
  boolean_query: string;
  platform: string;
  results_count: number;
  created_at: string;
  is_favorite: boolean;
  tags: string[];
  project_id: string | null;
  project?: Project;
}

interface UseSearchHistoryOptions {
  userId: string | undefined;
  pageSize?: number;
}

interface UseSearchHistoryReturn {
  searchHistory: SearchHistoryItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  fetchSearchHistory: () => Promise<SearchHistoryItem[]>;
  loadMore: () => Promise<void>;
  toggleFavorite: (searchId: string, currentStatus: boolean) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  refresh: () => Promise<SearchHistoryItem[]>;
}

const BATCH_SIZE = 30; // Firestore IN query limit

export function useSearchHistory({
  userId,
  pageSize = 50
}: UseSearchHistoryOptions): UseSearchHistoryReturn {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  const batchFetchProjects = async (projectIds: string[]): Promise<Map<string, Project>> => {
    const projectMap = new Map<string, Project>();

    if (!db || projectIds.length === 0) return projectMap;

    // Batch fetch in chunks of 30 (Firestore limit)
    for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
      const batchIds = projectIds.slice(i, i + BATCH_SIZE);
      const projectsQuery = query(
        collection(db, 'projects'),
        where(documentId(), 'in', batchIds)
      );

      const projectsSnapshot = await getDocs(projectsQuery);

      projectsSnapshot.docs.forEach(projectSnap => {
        const projectData = projectSnap.data() as Project;
        projectMap.set(projectSnap.id, {
          id: projectSnap.id,
          ...projectData,
          created_at: normalizeTimestamp(projectData.created_at),
          updated_at: normalizeTimestamp(projectData.updated_at)
        });
      });
    }

    return projectMap;
  };

  const fetchSearchHistory = useCallback(async (isLoadMore = false): Promise<SearchHistoryItem[]> => {
    if (!userId || !db) {
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

      // Build query with pagination
      const queryConstraints = [
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(pageSize)
      ];

      if (isLoadMore && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const historyQuery = query(
        collection(db, 'search_history'),
        ...queryConstraints
      );

      const snapshot = await getDocs(historyQuery);

      // Update pagination state
      setHasMore(snapshot.docs.length === pageSize);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      // Collect unique project IDs for batch fetching
      const projectIds = new Set<string>();
      const historyDocs = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        if (data.project_id) {
          projectIds.add(data.project_id);
        }
        return {
          docId: docSnap.id,
          data
        };
      });

      // Batch fetch all projects
      const projectMap = await batchFetchProjects(Array.from(projectIds));

      // Map history items with their projects
      const history = historyDocs.map(({ docId, data }) => ({
        id: docId,
        ...(data as SearchHistoryItem),
        created_at: normalizeTimestamp(data.created_at),
        project: data.project_id ? projectMap.get(data.project_id) : undefined
      } as SearchHistoryItem));

      if (isLoadMore) {
        setSearchHistory(prev => [...prev, ...history]);
      } else {
        setSearchHistory(history);
      }

      return history;
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast.error("Failed to load search history");
      return [];
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, pageSize, lastDoc]);

  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await fetchSearchHistory(true);
    }
  }, [loadingMore, hasMore, fetchSearchHistory]);

  const toggleFavorite = useCallback(async (searchId: string, currentStatus: boolean) => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      const searchRef = doc(db, 'search_history', searchId);
      await updateDoc(searchRef, {
        is_favorite: !currentStatus,
        updated_at: new Date().toISOString()
      });

      // Update local state
      setSearchHistory(prev =>
        prev.map(item =>
          item.id === searchId
            ? { ...item, is_favorite: !currentStatus }
            : item
        )
      );

      toast.success(currentStatus ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  }, []);

  const deleteSearch = useCallback(async (searchId: string) => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      await deleteDoc(doc(db, 'search_history', searchId));

      // Update local state
      setSearchHistory(prev => prev.filter(item => item.id !== searchId));

      toast.success("Search deleted successfully");
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error("Failed to delete search");
    }
  }, []);

  const refresh = useCallback(async () => {
    return fetchSearchHistory(false);
  }, [fetchSearchHistory]);

  return {
    searchHistory,
    loading,
    loadingMore,
    hasMore,
    fetchSearchHistory: () => fetchSearchHistory(false),
    loadMore,
    toggleFavorite,
    deleteSearch,
    refresh
  };
}
