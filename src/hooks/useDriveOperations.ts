/**
 * Custom hook for Google Drive file operations
 * 
 * Provides mutations for common Drive operations like sharing, copying,
 * moving, deleting, and organizing files.
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoogleDriveFile,
  GoogleMimeType
} from '@/types/google-api';
import { 
  GoogleDriveShareParams,
  GoogleDriveBatchOperation,
  googleDriveService 
} from '@/lib/GoogleDriveService';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

export interface UseDriveOperationsResult {
  createFolder: (name: string, parentFolderId?: string) => Promise<GoogleDriveFile>;
  shareFile: (params: GoogleDriveShareParams) => Promise<void>;
  copyFile: (fileId: string, newName?: string, parentFolderId?: string) => Promise<GoogleDriveFile>;
  moveFile: (fileId: string, newParentFolderId: string) => Promise<GoogleDriveFile>;
  deleteFile: (fileId: string) => Promise<void>;
  permanentlyDeleteFile: (fileId: string) => Promise<void>;
  toggleStar: (fileId: string, starred: boolean) => Promise<void>;
  batchOperation: (operation: GoogleDriveBatchOperation) => Promise<void>;
  downloadFile: (fileId: string) => Promise<string>;
  exportFile: (fileId: string, mimeType: GoogleMimeType) => Promise<string>;
  getDocumentContent: (documentId: string) => Promise<string>;
  convertToHtml: (documentId: string) => Promise<string>;
  convertToMarkdown: (documentId: string) => Promise<string>;
  isLoading: boolean;
  operations: {
    createFolder: { isLoading: boolean; error: Error | null };
    shareFile: { isLoading: boolean; error: Error | null };
    copyFile: { isLoading: boolean; error: Error | null };
    moveFile: { isLoading: boolean; error: Error | null };
    deleteFile: { isLoading: boolean; error: Error | null };
    permanentDelete: { isLoading: boolean; error: Error | null };
    toggleStar: { isLoading: boolean; error: Error | null };
    batchOperation: { isLoading: boolean; error: Error | null };
    downloadFile: { isLoading: boolean; error: Error | null };
    exportFile: { isLoading: boolean; error: Error | null };
    getDocument: { isLoading: boolean; error: Error | null };
    convertToHtml: { isLoading: boolean; error: Error | null };
    convertToMarkdown: { isLoading: boolean; error: Error | null };
  };
}

/**
 * Hook for Google Drive operations
 */
export function useDriveOperations(): UseDriveOperationsResult {
  const { accessToken, isAuthenticated } = useGoogleAuth();
  const queryClient = useQueryClient();

  // Helper function to invalidate related queries
  const invalidateQueries = useCallback((fileId?: string, parentFolderId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['drive-files'] });
    queryClient.invalidateQueries({ queryKey: ['drive-recent-files'] });
    queryClient.invalidateQueries({ queryKey: ['drive-starred-files'] });
    queryClient.invalidateQueries({ queryKey: ['drive-shared-files'] });
    
    if (fileId) {
      queryClient.invalidateQueries({ queryKey: ['drive-file', fileId] });
    }
    
    if (parentFolderId) {
      queryClient.invalidateQueries({ queryKey: ['drive-folder-contents', parentFolderId] });
    }
  }, [queryClient]);

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentFolderId }: { name: string; parentFolderId?: string }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.createFolder(name, parentFolderId);
    },
    onSuccess: (folder, variables) => {
      invalidateQueries(undefined, variables.parentFolderId);
      toast.success(`Folder "${folder.name}" created successfully`);
    },
    onError: (error) => {
      console.error('Create folder error:', error);
      toast.error('Failed to create folder');
    }
  });

  // Share file mutation
  const shareFileMutation = useMutation({
    mutationFn: async (params: GoogleDriveShareParams) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.shareFile(params);
    },
    onSuccess: (_, variables) => {
      invalidateQueries(variables.fileId);
      toast.success('File shared successfully');
    },
    onError: (error) => {
      console.error('Share file error:', error);
      toast.error('Failed to share file');
    }
  });

  // Copy file mutation
  const copyFileMutation = useMutation({
    mutationFn: async ({ fileId, newName, parentFolderId }: { 
      fileId: string; 
      newName?: string; 
      parentFolderId?: string; 
    }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.copyFile(fileId, newName, parentFolderId);
    },
    onSuccess: (copiedFile, variables) => {
      invalidateQueries(variables.fileId, variables.parentFolderId);
      toast.success(`File copied as "${copiedFile.name}"`);
    },
    onError: (error) => {
      console.error('Copy file error:', error);
      toast.error('Failed to copy file');
    }
  });

  // Move file mutation
  const moveFileMutation = useMutation({
    mutationFn: async ({ fileId, newParentFolderId }: { 
      fileId: string; 
      newParentFolderId: string; 
    }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.moveFile(fileId, newParentFolderId);
    },
    onSuccess: (movedFile, variables) => {
      invalidateQueries(variables.fileId, variables.newParentFolderId);
      toast.success(`File moved to new location`);
    },
    onError: (error) => {
      console.error('Move file error:', error);
      toast.error('Failed to move file');
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.deleteFile(fileId);
    },
    onSuccess: (_, fileId) => {
      invalidateQueries(fileId);
      toast.success('File moved to trash');
    },
    onError: (error) => {
      console.error('Delete file error:', error);
      toast.error('Failed to delete file');
    }
  });

  // Permanently delete file mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.permanentlyDeleteFile(fileId);
    },
    onSuccess: (_, fileId) => {
      invalidateQueries(fileId);
      toast.success('File permanently deleted');
    },
    onError: (error) => {
      console.error('Permanent delete error:', error);
      toast.error('Failed to permanently delete file');
    }
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ fileId, starred }: { fileId: string; starred: boolean }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.toggleStar(fileId, starred);
    },
    onSuccess: (_, variables) => {
      invalidateQueries(variables.fileId);
      toast.success(variables.starred ? 'File starred' : 'File unstarred');
    },
    onError: (error) => {
      console.error('Toggle star error:', error);
      toast.error('Failed to update star status');
    }
  });

  // Batch operation mutation
  const batchOperationMutation = useMutation({
    mutationFn: async (operation: GoogleDriveBatchOperation) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.batchOperation(operation);
    },
    onSuccess: (_, variables) => {
      invalidateQueries();
      toast.success(`Batch ${variables.operation} completed`);
    },
    onError: (error) => {
      console.error('Batch operation error:', error);
      toast.error('Batch operation failed');
    }
  });

  // Download file mutation
  const downloadFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.downloadFile(fileId);
    },
    onError: (error) => {
      console.error('Download file error:', error);
      toast.error('Failed to download file');
    }
  });

  // Export file mutation
  const exportFileMutation = useMutation({
    mutationFn: async ({ fileId, mimeType }: { fileId: string; mimeType: GoogleMimeType }) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.exportFile({ fileId, mimeType });
    },
    onError: (error) => {
      console.error('Export file error:', error);
      toast.error('Failed to export file');
    }
  });

  // Get document content mutation
  const getDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      const document = await googleDriveService.getDocumentContent(documentId);
      return JSON.stringify(document, null, 2); // Return formatted JSON
    },
    onError: (error) => {
      console.error('Get document error:', error);
      toast.error('Failed to get document content');
    }
  });

  // Convert to HTML mutation
  const convertToHtmlMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.convertDocumentToHtml(documentId);
    },
    onError: (error) => {
      console.error('Convert to HTML error:', error);
      toast.error('Failed to convert document to HTML');
    }
  });

  // Convert to Markdown mutation
  const convertToMarkdownMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.convertDocumentToMarkdown(documentId);
    },
    onError: (error) => {
      console.error('Convert to Markdown error:', error);
      toast.error('Failed to convert document to Markdown');
    }
  });

  // Wrapper functions
  const createFolder = useCallback(async (name: string, parentFolderId?: string) => {
    return await createFolderMutation.mutateAsync({ name, parentFolderId });
  }, [createFolderMutation]);

  const shareFile = useCallback(async (params: GoogleDriveShareParams) => {
    return await shareFileMutation.mutateAsync(params);
  }, [shareFileMutation]);

  const copyFile = useCallback(async (fileId: string, newName?: string, parentFolderId?: string) => {
    return await copyFileMutation.mutateAsync({ fileId, newName, parentFolderId });
  }, [copyFileMutation]);

  const moveFile = useCallback(async (fileId: string, newParentFolderId: string) => {
    return await moveFileMutation.mutateAsync({ fileId, newParentFolderId });
  }, [moveFileMutation]);

  const deleteFile = useCallback(async (fileId: string) => {
    return await deleteFileMutation.mutateAsync(fileId);
  }, [deleteFileMutation]);

  const permanentlyDeleteFile = useCallback(async (fileId: string) => {
    return await permanentDeleteMutation.mutateAsync(fileId);
  }, [permanentDeleteMutation]);

  const toggleStar = useCallback(async (fileId: string, starred: boolean) => {
    return await toggleStarMutation.mutateAsync({ fileId, starred });
  }, [toggleStarMutation]);

  const batchOperation = useCallback(async (operation: GoogleDriveBatchOperation) => {
    return await batchOperationMutation.mutateAsync(operation);
  }, [batchOperationMutation]);

  const downloadFile = useCallback(async (fileId: string) => {
    return await downloadFileMutation.mutateAsync(fileId);
  }, [downloadFileMutation]);

  const exportFile = useCallback(async (fileId: string, mimeType: GoogleMimeType) => {
    return await exportFileMutation.mutateAsync({ fileId, mimeType });
  }, [exportFileMutation]);

  const getDocumentContent = useCallback(async (documentId: string) => {
    return await getDocumentMutation.mutateAsync(documentId);
  }, [getDocumentMutation]);

  const convertToHtml = useCallback(async (documentId: string) => {
    return await convertToHtmlMutation.mutateAsync(documentId);
  }, [convertToHtmlMutation]);

  const convertToMarkdown = useCallback(async (documentId: string) => {
    return await convertToMarkdownMutation.mutateAsync(documentId);
  }, [convertToMarkdownMutation]);

  // Combined loading state
  const isLoading = 
    createFolderMutation.isPending ||
    shareFileMutation.isPending ||
    copyFileMutation.isPending ||
    moveFileMutation.isPending ||
    deleteFileMutation.isPending ||
    permanentDeleteMutation.isPending ||
    toggleStarMutation.isPending ||
    batchOperationMutation.isPending ||
    downloadFileMutation.isPending ||
    exportFileMutation.isPending ||
    getDocumentMutation.isPending ||
    convertToHtmlMutation.isPending ||
    convertToMarkdownMutation.isPending;

  return {
    createFolder,
    shareFile,
    copyFile,
    moveFile,
    deleteFile,
    permanentlyDeleteFile,
    toggleStar,
    batchOperation,
    downloadFile,
    exportFile,
    getDocumentContent,
    convertToHtml,
    convertToMarkdown,
    isLoading,
    operations: {
      createFolder: { 
        isLoading: createFolderMutation.isPending, 
        error: createFolderMutation.error 
      },
      shareFile: { 
        isLoading: shareFileMutation.isPending, 
        error: shareFileMutation.error 
      },
      copyFile: { 
        isLoading: copyFileMutation.isPending, 
        error: copyFileMutation.error 
      },
      moveFile: { 
        isLoading: moveFileMutation.isPending, 
        error: moveFileMutation.error 
      },
      deleteFile: { 
        isLoading: deleteFileMutation.isPending, 
        error: deleteFileMutation.error 
      },
      permanentDelete: { 
        isLoading: permanentDeleteMutation.isPending, 
        error: permanentDeleteMutation.error 
      },
      toggleStar: { 
        isLoading: toggleStarMutation.isPending, 
        error: toggleStarMutation.error 
      },
      batchOperation: { 
        isLoading: batchOperationMutation.isPending, 
        error: batchOperationMutation.error 
      },
      downloadFile: { 
        isLoading: downloadFileMutation.isPending, 
        error: downloadFileMutation.error 
      },
      exportFile: { 
        isLoading: exportFileMutation.isPending, 
        error: exportFileMutation.error 
      },
      getDocument: { 
        isLoading: getDocumentMutation.isPending, 
        error: getDocumentMutation.error 
      },
      convertToHtml: { 
        isLoading: convertToHtmlMutation.isPending, 
        error: convertToHtmlMutation.error 
      },
      convertToMarkdown: { 
        isLoading: convertToMarkdownMutation.isPending, 
        error: convertToMarkdownMutation.error 
      }
    }
  };
}