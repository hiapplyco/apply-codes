/**
 * Custom hook for Google Drive file upload operations
 * 
 * Provides upload functionality with progress tracking, batch uploads,
 * and error handling.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GoogleDriveFile, 
  GoogleMimeType
} from '@/types/google-api';
import { 
  GoogleDriveUploadParams, 
  googleDriveService 
} from '@/lib/GoogleDriveService';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { toast } from 'sonner';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: GoogleDriveFile;
}

export interface UploadQueueItem {
  id: string;
  name: string;
  file: File;
  folderId?: string;
  mimeType?: GoogleMimeType;
  description?: string;
  starred?: boolean;
}

export interface UseDriveUploadOptions {
  maxConcurrent?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  autoUpload?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (file: GoogleDriveFile) => void;
  onError?: (error: Error, fileName: string) => void;
}

export interface UseDriveUploadResult {
  uploadFile: (params: GoogleDriveUploadParams) => Promise<GoogleDriveFile>;
  uploadFiles: (files: File[], folderId?: string) => Promise<void>;
  uploadFromUrl: (url: string, fileName: string, folderId?: string) => Promise<GoogleDriveFile>;
  uploadQueue: UploadQueueItem[];
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  clearQueue: () => void;
  removeFromQueue: (id: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  totalProgress: number;
}

/**
 * Hook for Google Drive file uploads
 */
export function useDriveUpload(options: UseDriveUploadOptions = {}): UseDriveUploadResult {
  const { accessToken, isAuthenticated } = useGoogleAuth();
  const queryClient = useQueryClient();
  
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const activeUploads = useRef<Set<string>>(new Set());
  const maxConcurrent = options.maxConcurrent || 3;
  const maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB default
  const allowedTypes = options.allowedTypes || [];

  // Single file upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (params: GoogleDriveUploadParams) => {
      if (!isAuthenticated || !accessToken) {
        throw new Error('Not authenticated');
      }

      return await googleDriveService.uploadFile(params);
    },
    onSuccess: (file, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-folder-contents'] });
      
      // Call success callback
      options.onComplete?.(file);
      
      toast.success(`File "${file.name}" uploaded successfully`);
    },
    onError: (error, variables) => {
      console.error('Upload error:', error);
      options.onError?.(error as Error, variables.name);
      toast.error(`Failed to upload "${variables.name}"`);
    }
  });

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds limit of ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  // Upload single file
  const uploadFile = useCallback(async (params: GoogleDriveUploadParams): Promise<GoogleDriveFile> => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    // Validate file if it's a File object
    if (params.content instanceof File) {
      const validationError = validateFile(params.content);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    const uploadId = `upload-${Date.now()}-${Math.random()}`;
    
    // Add to progress tracking
    setUploadProgress(prev => [...prev, {
      fileId: uploadId,
      fileName: params.name,
      progress: 0,
      status: 'pending'
    }]);

    try {
      // Update progress to uploading
      setUploadProgress(prev => prev.map(p => 
        p.fileId === uploadId 
          ? { ...p, status: 'uploading' as const, progress: 10 }
          : p
      ));

      const result = await uploadMutation.mutateAsync(params);

      // Update progress to completed
      setUploadProgress(prev => prev.map(p => 
        p.fileId === uploadId 
          ? { ...p, status: 'completed' as const, progress: 100, result }
          : p
      ));

      return result;
    } catch (error) {
      // Update progress to error
      setUploadProgress(prev => prev.map(p => 
        p.fileId === uploadId 
          ? { ...p, status: 'error' as const, error: (error as Error).message }
          : p
      ));

      throw error;
    }
  }, [isAuthenticated, accessToken, validateFile, uploadMutation]);

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[], folderId?: string): Promise<void> => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        invalidFiles.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    // Show validation errors
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Add files to upload queue
    const queueItems: UploadQueueItem[] = validFiles.map(file => ({
      id: `queue-${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      folderId,
      mimeType: file.type as GoogleMimeType
    }));

    setUploadQueue(prev => [...prev, ...queueItems]);

    if (options.autoUpload !== false) {
      // Start processing queue
      processUploadQueue();
    }
  }, [isAuthenticated, accessToken, validateFile, options.autoUpload]);

  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (isUploading || uploadQueue.length === 0) return;

    setIsUploading(true);

    try {
      const concurrent = Math.min(maxConcurrent, uploadQueue.length);
      const batches: UploadQueueItem[][] = [];
      
      for (let i = 0; i < uploadQueue.length; i += concurrent) {
        batches.push(uploadQueue.slice(i, i + concurrent));
      }

      for (const batch of batches) {
        const uploadPromises = batch.map(async (item) => {
          if (activeUploads.current.has(item.id)) return;
          
          activeUploads.current.add(item.id);
          
          try {
            await uploadFile({
              name: item.name,
              content: item.file,
              mimeType: item.mimeType || item.file.type as GoogleMimeType,
              folderId: item.folderId,
              description: item.description,
              starred: item.starred
            });

            // Remove from queue on success
            setUploadQueue(prev => prev.filter(q => q.id !== item.id));
          } catch (error) {
            console.error(`Failed to upload ${item.name}:`, error);
          } finally {
            activeUploads.current.delete(item.id);
          }
        });

        await Promise.allSettled(uploadPromises);
      }
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, uploadQueue, maxConcurrent, uploadFile]);

  // Upload from URL
  const uploadFromUrl = useCallback(async (
    url: string, 
    fileName: string, 
    folderId?: string
  ): Promise<GoogleDriveFile> => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Fetch file content from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
      }

      const content = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';

      return await uploadFile({
        name: fileName,
        content,
        mimeType: mimeType as GoogleMimeType,
        folderId
      });
    } catch (error) {
      throw new Error(`Failed to upload from URL: ${(error as Error).message}`);
    }
  }, [isAuthenticated, accessToken, uploadFile]);

  // Queue management functions
  const clearQueue = useCallback(() => {
    setUploadQueue([]);
    setUploadProgress([]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
    setUploadProgress(prev => prev.filter(item => item.fileId !== id));
  }, []);

  const pauseUpload = useCallback((id: string) => {
    // Implementation depends on how you want to handle pausing
    // For now, we'll just remove from active uploads
    activeUploads.current.delete(id);
  }, []);

  const resumeUpload = useCallback((id: string) => {
    // Resume upload by processing queue again
    processUploadQueue();
  }, [processUploadQueue]);

  const cancelUpload = useCallback((id: string) => {
    activeUploads.current.delete(id);
    removeFromQueue(id);
  }, [removeFromQueue]);

  // Calculate total progress
  const totalProgress = uploadProgress.length > 0 
    ? uploadProgress.reduce((sum, p) => sum + p.progress, 0) / uploadProgress.length
    : 0;

  return {
    uploadFile,
    uploadFiles,
    uploadFromUrl,
    uploadQueue,
    uploadProgress,
    isUploading,
    clearQueue,
    removeFromQueue,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    totalProgress
  };
}

/**
 * Hook for drag and drop file upload
 */
export function useDriveDropUpload(folderId?: string) {
  const upload = useDriveUpload({
    autoUpload: true,
    maxConcurrent: 2
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      upload.uploadFiles(files, folderId);
    }
  }, [upload, folderId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return {
    ...upload,
    dropHandlers: {
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave
    }
  };
}

/**
 * Hook for file input upload
 */
export function useDriveFileInput(options: UseDriveUploadOptions & {
  multiple?: boolean;
  accept?: string;
} = {}) {
  const upload = useDriveUpload(options);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      upload.uploadFiles(files);
    }
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, [upload]);

  const FileInput = useCallback(() => (
    <input
      ref={fileInputRef}
      type="file"
      multiple={options.multiple}
      accept={options.accept}
      onChange={handleFileSelect}
      style={{ display: 'none' }}
    />
  ), [options.multiple, options.accept, handleFileSelect]);

  return {
    ...upload,
    openFileDialog,
    FileInput
  };
}