/**
 * Custom hook for managing Google Drive files
 * 
 * Provides reactive access to Drive files with caching, pagination,
 * and real-time updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoogleDriveFile, 
  GoogleDriveFileList, 
  GoogleDriveSearchParams,
  GoogleMimeType 
} from '@/types/google-api';
import { googleDriveService } from '@/lib/GoogleDriveService';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

export interface UseDriveFilesOptions {
  folderId?: string;
  searchQuery?: string;
  mimeType?: GoogleMimeType;
  includeShared?: boolean;
  includeTrashed?: boolean;
  pageSize?: number;
  orderBy?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseDriveFilesResult {
  files: GoogleDriveFile[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  totalCount: number;
}

/**
 * Hook for fetching and managing Google Drive files
 */
export function useDriveFiles(options: UseDriveFilesOptions = {}): UseDriveFilesResult {
  const { accessToken, isAuthenticated } = useGoogleAuth();
  const queryClient = useQueryClient();
  const [allFiles, setAllFiles] = useState<GoogleDriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: GoogleDriveSearchParams = {
      pageSize: options.pageSize || 50,
      orderBy: options.orderBy || 'modifiedTime desc'
    };

    // Build search query
    const conditions: string[] = [];

    if (options.folderId) {
      conditions.push(`'${options.folderId}' in parents`);
    }

    if (options.searchQuery) {
      conditions.push(`name contains '${options.searchQuery}' or fullText contains '${options.searchQuery}'`);
    }

    if (options.mimeType) {
      conditions.push(`mimeType = '${options.mimeType}'`);
    }

    if (options.includeShared) {
      conditions.push('sharedWithMe = true');
    }

    if (!options.includeTrashed) {
      conditions.push('trashed = false');
    }

    if (conditions.length > 0) {
      params.q = conditions.join(' and ');
    }

    return params;
  }, [options]);

  // Query key for caching
  const queryKey = ['drive-files', queryParams];

  // Initialize service when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      googleDriveService.initialize(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  // Main query for fetching files
  const {
    data: fileListData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.getFiles(queryParams);
    },
    enabled: options.enabled !== false && isAuthenticated && !!accessToken,
    refetchInterval: options.refetchInterval,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (fileListData) {
      setAllFiles(fileListData.files);
      setNextPageToken(fileListData.nextPageToken);
    }
  }, [fileListData]);

  // Fetch next page function
  const fetchNextPage = useCallback(async () => {
    if (!nextPageToken || !isAuthenticated || !accessToken) return;

    try {
      const nextParams = { ...queryParams, pageToken: nextPageToken };
      const nextData = await googleDriveService.getFiles(nextParams);
      
      setAllFiles(prev => [...prev, ...nextData.files]);
      setNextPageToken(nextData.nextPageToken);
    } catch (error) {
      console.error('Error fetching next page:', error);
      toast.error('Failed to load more files');
    }
  }, [nextPageToken, queryParams, isAuthenticated, accessToken]);

  return {
    files: allFiles,
    isLoading,
    isError,
    error: error as Error | null,
    hasNextPage: !!nextPageToken,
    isFetchingNextPage: false, // Could be enhanced with separate loading state
    fetchNextPage,
    refetch,
    totalCount: allFiles.length
  };
}

/**
 * Hook for fetching a specific file
 */
export function useDriveFile(fileId: string | null) {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  return useQuery({
    queryKey: ['drive-file', fileId],
    queryFn: async () => {
      if (!fileId || !isAuthenticated || !accessToken) {
        throw new Error('File ID required and user must be authenticated');
      }

      return await googleDriveService.getFile(fileId);
    },
    enabled: !!fileId && isAuthenticated && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for recent files
 */
export function useRecentFiles(limit: number = 20) {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  return useQuery({
    queryKey: ['drive-recent-files', limit],
    queryFn: async () => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.getRecentFiles(limit);
    },
    enabled: isAuthenticated && !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for starred files
 */
export function useStarredFiles() {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  return useQuery({
    queryKey: ['drive-starred-files'],
    queryFn: async () => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.getStarredFiles();
    },
    enabled: isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for shared files
 */
export function useSharedFiles() {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  return useQuery({
    queryKey: ['drive-shared-files'],
    queryFn: async () => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.getSharedFiles();
    },
    enabled: isAuthenticated && !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for folder contents
 */
export function useFolderContents(folderId: string | null) {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  return useQuery({
    queryKey: ['drive-folder-contents', folderId],
    queryFn: async () => {
      if (!folderId || !isAuthenticated || !accessToken) {
        throw new Error('Folder ID required and user must be authenticated');
      }

      return await googleDriveService.getFolderContents(folderId);
    },
    enabled: !!folderId && isAuthenticated && !!accessToken,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for file search
 */
export function useFileSearch() {
  const { accessToken, isAuthenticated } = useGoogleAuth();
  const [searchResults, setSearchResults] = useState<GoogleDriveFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchFiles = useCallback(async (
    query: string,
    options: {
      mimeType?: GoogleMimeType;
      folderId?: string;
      includeShared?: boolean;
      includeTrashed?: boolean;
      pageSize?: number;
    } = {}
  ) => {
    if (!isAuthenticated || !accessToken) {
      toast.error('Please authenticate with Google Drive first');
      return;
    }

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await googleDriveService.searchFiles(query, options);
      setSearchResults(results.files);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isAuthenticated, accessToken]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    searchFiles,
    clearSearch,
    searchResults,
    isSearching
  };
}

/**
 * Hook for file type filtering
 */
export function useFileTypeFilter() {
  const [selectedTypes, setSelectedTypes] = useState<GoogleMimeType[]>([]);

  const toggleType = useCallback((mimeType: GoogleMimeType) => {
    setSelectedTypes(prev => 
      prev.includes(mimeType) 
        ? prev.filter(type => type !== mimeType)
        : [...prev, mimeType]
    );
  }, []);

  const clearTypes = useCallback(() => {
    setSelectedTypes([]);
  }, []);

  const isTypeSelected = useCallback((mimeType: GoogleMimeType) => {
    return selectedTypes.includes(mimeType);
  }, [selectedTypes]);

  return {
    selectedTypes,
    toggleType,
    clearTypes,
    isTypeSelected
  };
}

/**
 * Hook for file sorting
 */
export function useFileSorting() {
  const [sortBy, setSortBy] = useState<string>('modifiedTime desc');

  const sortOptions = [
    { value: 'modifiedTime desc', label: 'Modified (newest first)' },
    { value: 'modifiedTime', label: 'Modified (oldest first)' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name desc', label: 'Name (Z-A)' },
    { value: 'createdTime desc', label: 'Created (newest first)' },
    { value: 'createdTime', label: 'Created (oldest first)' },
    { value: 'folder', label: 'Folders first' },
    { value: 'starred desc', label: 'Starred first' }
  ];

  const getSortLabel = useCallback((value: string) => {
    return sortOptions.find(option => option.value === value)?.label || value;
  }, []);

  return {
    sortBy,
    setSortBy,
    sortOptions,
    getSortLabel
  };
}