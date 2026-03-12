import { useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  documentId
} from 'firebase/firestore';
import { normalizeTimestamp } from '@/lib/timestamp';
import { startOfWeek, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import type { SearchHistoryItem, UserStats, Project } from '@/types/profile';

export function useSearchHistory(userId: string | undefined) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const fetchSearchHistory = async (): Promise<SearchHistoryItem[]> => {
    if (!userId) return [];

    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return [];
      }

      const historyQuery = query(
        collection(db, 'search_history'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(historyQuery);

      // Collect all unique project_ids for batch fetching
      const projectIds = new Set<string>();
      const historyDocs = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        if (data.project_id) {
          projectIds.add(data.project_id);
        }
        return { docId: docSnap.id, data };
      });

      // Batch fetch all projects at once (instead of N+1 queries)
      const projectMap = new Map<string, Project>();
      const projectIdArray = Array.from(projectIds);

      if (projectIdArray.length > 0) {
        const BATCH_SIZE = 30;
        for (let i = 0; i < projectIdArray.length; i += BATCH_SIZE) {
          const batchIds = projectIdArray.slice(i, i + BATCH_SIZE);
          const projectsQuery = query(
            collection(db, 'projects'),
            where(documentId(), 'in', batchIds)
          );
          const projectsSnapshot = await getDocs(projectsQuery);

          projectsSnapshot.docs.forEach(projectSnap => {
            const projectData = projectSnap.data() as Project;
            projectMap.set(projectSnap.id, {
              ...projectData,
              id: projectSnap.id,
              created_at: normalizeTimestamp(projectData.created_at),
              updated_at: normalizeTimestamp(projectData.updated_at)
            });
          });
        }
      }

      const history = historyDocs.map(({ docId, data }) => ({
        ...(data as SearchHistoryItem),
        id: docId,
        created_at: normalizeTimestamp(data.created_at),
        project: data.project_id ? projectMap.get(data.project_id) : undefined
      } as SearchHistoryItem));

      setSearchHistory(history);
      return history;
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast.error("Failed to load search history");
      return [];
    }
  };

  const computeUserStats = async (searchHistoryData: SearchHistoryItem[]) => {
    if (!userId) return;

    try {
      if (!db) {
        console.warn("[Profile] Firestore not initialized");
        return;
      }

      const [candidatesSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'saved_candidates'), where('user_id', '==', userId))),
        getDocs(query(collection(db, 'projects'), where('user_id', '==', userId)))
      ]);

      const searchCount = searchHistoryData.length;
      const favoritesCount = searchHistoryData.filter(search => search.is_favorite).length;

      const weekStart = startOfWeek(new Date());
      const monthStart = startOfMonth(new Date());
      const weekIso = weekStart.toISOString();
      const monthIso = monthStart.toISOString();

      const weekSearches = searchHistoryData.filter(search => search.created_at >= weekIso).length;
      const monthSearches = searchHistoryData.filter(search => search.created_at >= monthIso).length;

      const recentActivity = [...searchHistoryData]
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 5)
        .map(search => ({
          id: search.id,
          type: 'search' as const,
          description: `Searched for "${search.search_query}"`,
          timestamp: search.created_at
        }));

      setUserStats({
        totalSearches: searchCount,
        totalCandidatesSaved: candidatesSnapshot.size,
        totalProjects: projectsSnapshot.size,
        favoriteSearches: favoritesCount,
        searchesThisWeek: weekSearches,
        searchesThisMonth: monthSearches,
        recentActivity
      });
    } catch (error) {
      console.error('Error computing user stats:', error);
      toast.error("Failed to load statistics");
    }
  };

  const toggleFavorite = async (searchId: string, currentStatus: boolean) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const searchRef = doc(db, 'search_history', searchId);
      await updateDoc(searchRef, {
        is_favorite: !currentStatus,
        updated_at: new Date().toISOString()
      });

      fetchSearchHistory();
      toast.success(currentStatus ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const deleteSearch = async (searchId: string) => {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await deleteDoc(doc(db, 'search_history', searchId));

      fetchSearchHistory();
      toast.success("Search deleted successfully");
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error("Failed to delete search");
    }
  };

  return {
    searchHistory,
    userStats,
    fetchSearchHistory,
    computeUserStats,
    toggleFavorite,
    deleteSearch,
  };
}
