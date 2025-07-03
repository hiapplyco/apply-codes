/**
 * Drive Drag & Drop Importer
 * 
 * Component for handling drag-and-drop of Google Drive file URLs
 * and importing them directly into content areas.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { GoogleDriveFile } from '@/types/google-api';
import { googleDriveService } from '@/lib/GoogleDriveService';
import { 
  extractGoogleFileId, 
  isGoogleApiConfigured 
} from '@/lib/google-api-config';
import { 
  getFileTypeInfo,
  convertDocumentToHtml,
  convertDocumentToMarkdown,
  extractTextFromDocument
} from '@/utils/driveFileUtils';
import { useDriveOperations } from '@/hooks/useDriveOperations';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Download,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export interface DriveDragDropImporterProps {
  editor?: Editor | null;
  onFileImport?: (file: GoogleDriveFile, content: string) => void;
  onFileDetected?: (file: GoogleDriveFile) => void;
  acceptedTypes?: string[];
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  autoImport?: boolean;
  importFormat?: 'html' | 'markdown' | 'text';
}

interface DragDropState {
  isDragOver: boolean;
  isDragValid: boolean;
  draggedUrl: string | null;
  isProcessing: boolean;
  lastImportedFile: GoogleDriveFile | null;
}

export function DriveDragDropImporter({
  editor,
  onFileImport,
  onFileDetected,
  acceptedTypes = [],
  className,
  children,
  disabled = false,
  autoImport = true,
  importFormat = 'html'
}: DriveDragDropImporterProps) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragOver: false,
    isDragValid: false,
    draggedUrl: null,
    isProcessing: false,
    lastImportedFile: null
  });

  const { isAuthenticated } = useGoogleAuth();
  const operations = useDriveOperations();
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if Google Drive URL is valid
  const isValidDriveUrl = useCallback((url: string): boolean => {
    return extractGoogleFileId(url) !== null;
  }, []);

  // Extract file info from dropped URL
  const extractFileFromUrl = useCallback(async (url: string): Promise<GoogleDriveFile | null> => {
    const fileId = extractGoogleFileId(url);
    if (!fileId) return null;

    try {
      const file = await googleDriveService.getFile(fileId);
      return file;
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }, []);

  // Import file content based on type and format
  const importFileContent = useCallback(async (
    file: GoogleDriveFile, 
    format: string = importFormat
  ): Promise<string> => {
    const fileTypeInfo = getFileTypeInfo(file.mimeType);
    let content = '';

    try {
      if (file.mimeType === 'application/vnd.google-apps.document') {
        switch (format) {
          case 'html':
            content = await convertDocumentToHtml(file.id);
            break;
          case 'markdown':
            content = await convertDocumentToMarkdown(file.id);
            break;
          case 'text':
            content = await extractTextFromDocument(file.id);
            break;
          default:
            content = await convertDocumentToHtml(file.id);
        }
      } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        if (format === 'text') {
          content = await operations.exportFile(file.id, 'text/csv' as any);
        } else {
          content = await operations.exportFile(file.id, 'text/html' as any);
        }
      } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
        if (format === 'text') {
          content = await operations.exportFile(file.id, 'text/plain' as any);
        } else {
          content = await operations.exportFile(file.id, 'text/html' as any);
        }
      } else if (fileTypeInfo.category === 'image') {
        // For images, return the web content link
        if (file.webContentLink) {
          content = `<img src="${file.webContentLink}" alt="${file.name}" />`;
        } else if (file.webViewLink) {
          content = `<a href="${file.webViewLink}" target="_blank">${file.name}</a>`;
        }
      } else if (file.mimeType.startsWith('text/')) {
        content = await operations.downloadFile(file.id);
      } else {
        // For other file types, create a link
        content = `<a href="${file.webViewLink || file.webContentLink}" target="_blank">${file.name}</a>`;
      }

      return content;
    } catch (error) {
      console.error('Failed to import file content:', error);
      throw error;
    }
  }, [importFormat, operations]);

  // Handle file drop processing
  const processDroppedFile = useCallback(async (url: string) => {
    if (!isAuthenticated || !isGoogleApiConfigured()) {
      toast.error('Please authenticate with Google Drive first');
      return;
    }

    setDragState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Extract file info
      const file = await extractFileFromUrl(url);
      if (!file) {
        toast.error('Could not access the Google Drive file');
        return;
      }

      // Check if file type is accepted
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.mimeType)) {
        toast.error(`File type ${file.mimeType} is not supported`);
        return;
      }

      // Notify about file detection
      onFileDetected?.(file);

      setDragState(prev => ({ ...prev, lastImportedFile: file }));

      if (autoImport) {
        // Import file content
        const content = await importFileContent(file);
        
        // Insert into editor if available
        if (editor && content) {
          if (importFormat === 'html') {
            editor.commands.insertContent(content);
          } else if (importFormat === 'markdown') {
            // Convert markdown to HTML for Tiptap
            editor.commands.insertContent(`<pre>${content}</pre>`);
          } else {
            editor.commands.insertContent(`<p>${content.replace(/\n/g, '</p><p>')}</p>`);
          }
        }

        // Notify about successful import
        onFileImport?.(file, content);
        toast.success(`Imported "${file.name}" successfully`);
      } else {
        toast.success(`Detected Google Drive file: "${file.name}"`);
      }

    } catch (error) {
      console.error('Failed to process dropped file:', error);
      toast.error('Failed to import Google Drive file');
    } finally {
      setDragState(prev => ({ 
        ...prev, 
        isProcessing: false,
        isDragOver: false,
        isDragValid: false,
        draggedUrl: null
      }));
    }
  }, [
    isAuthenticated, 
    acceptedTypes, 
    onFileDetected, 
    autoImport, 
    importFileContent, 
    editor, 
    importFormat, 
    onFileImport,
    extractFileFromUrl
  ]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Clear existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    // Check if dragged data contains URLs
    const hasUrls = e.dataTransfer.types.includes('text/uri-list') || 
                   e.dataTransfer.types.includes('text/plain');

    setDragState(prev => ({
      ...prev,
      isDragOver: true,
      isDragValid: hasUrls
    }));
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Update drag effect
    e.dataTransfer.dropEffect = dragState.isDragValid ? 'copy' : 'none';
  }, [disabled, dragState.isDragValid]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Only hide drag state if leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      const isOutside = clientX < rect.left || clientX > rect.right || 
                       clientY < rect.top || clientY > rect.bottom;
      
      if (isOutside) {
        dragTimeoutRef.current = setTimeout(() => {
          setDragState(prev => ({
            ...prev,
            isDragOver: false,
            isDragValid: false,
            draggedUrl: null
          }));
        }, 100);
      }
    }
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Clear timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    // Get dropped URLs
    const urls = e.dataTransfer.getData('text/uri-list').split('\n').filter(Boolean);
    const plainText = e.dataTransfer.getData('text/plain');

    // Check for Google Drive URLs
    const allUrls = [...urls, plainText].filter(Boolean);
    const driveUrls = allUrls.filter(isValidDriveUrl);

    if (driveUrls.length === 0) {
      setDragState(prev => ({
        ...prev,
        isDragOver: false,
        isDragValid: false,
        draggedUrl: null
      }));
      toast.error('No valid Google Drive URLs found');
      return;
    }

    // Process the first valid Drive URL
    const driveUrl = driveUrls[0];
    setDragState(prev => ({ ...prev, draggedUrl: driveUrl }));
    
    await processDroppedFile(driveUrl);
  }, [disabled, isValidDriveUrl, processDroppedFile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  // Render drag overlay
  const renderDragOverlay = () => {
    if (!dragState.isDragOver) return null;

    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm border-2 border-dashed rounded-lg">
        <div className="text-center">
          {dragState.isProcessing ? (
            <>
              <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
              <p className="text-lg font-medium text-purple-700 mb-2">
                Processing Google Drive file...
              </p>
              <p className="text-sm text-gray-600">
                {dragState.draggedUrl && `Importing from: ${dragState.draggedUrl}`}
              </p>
            </>
          ) : dragState.isDragValid ? (
            <>
              <Download className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <p className="text-lg font-medium text-purple-700 mb-2">
                Drop to import from Google Drive
              </p>
              <p className="text-sm text-gray-600">
                Release to import the Google Drive file
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg font-medium text-red-700 mb-2">
                Invalid file type
              </p>
              <p className="text-sm text-gray-600">
                Only Google Drive URLs are supported
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render success indicator
  const renderSuccessIndicator = () => {
    if (!dragState.lastImportedFile) return null;

    return (
      <div className="absolute top-4 right-4 z-40 bg-green-100 border border-green-300 rounded-lg p-3 shadow-lg animate-in slide-in-from-top-2">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              File imported successfully
            </p>
            <p className="text-xs text-green-600">
              {dragState.lastImportedFile.name}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={dropZoneRef}
      className={cn(
        "relative",
        dragState.isDragOver && "ring-2 ring-purple-400 ring-offset-2",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {renderDragOverlay()}
      {renderSuccessIndicator()}
    </div>
  );
}

/**
 * Hook for drag and drop functionality
 */
export function useDriveDragDrop(
  editor?: Editor | null,
  options: {
    autoImport?: boolean;
    importFormat?: 'html' | 'markdown' | 'text';
    acceptedTypes?: string[];
    onFileImport?: (file: GoogleDriveFile, content: string) => void;
    onFileDetected?: (file: GoogleDriveFile) => void;
  } = {}
) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [lastImportedFile, setLastImportedFile] = useState<GoogleDriveFile | null>(null);

  const handleFileImport = useCallback((file: GoogleDriveFile, content: string) => {
    setLastImportedFile(file);
    options.onFileImport?.(file, content);
  }, [options]);

  const handleFileDetected = useCallback((file: GoogleDriveFile) => {
    options.onFileDetected?.(file);
  }, [options]);

  const DragDropWrapper = useCallback(({ children, ...props }: any) => (
    <DriveDragDropImporter
      editor={editor}
      disabled={!isEnabled}
      autoImport={options.autoImport}
      importFormat={options.importFormat}
      acceptedTypes={options.acceptedTypes}
      onFileImport={handleFileImport}
      onFileDetected={handleFileDetected}
      {...props}
    >
      {children}
    </DriveDragDropImporter>
  ), [
    editor, 
    isEnabled, 
    options.autoImport, 
    options.importFormat, 
    options.acceptedTypes,
    handleFileImport,
    handleFileDetected
  ]);

  return {
    DragDropWrapper,
    isEnabled,
    setIsEnabled,
    lastImportedFile,
    clearLastImported: () => setLastImportedFile(null)
  };
}

/**
 * Simple drag-drop zone for Drive URLs
 */
export function DriveDragDropZone({
  onFileImport,
  className,
  ...props
}: Omit<DriveDragDropImporterProps, 'children'> & {
  onFileImport: (file: GoogleDriveFile, content: string) => void;
}) {
  return (
    <DriveDragDropImporter
      onFileImport={onFileImport}
      className={className}
      {...props}
    >
      <div className="min-h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8 text-center hover:border-purple-400 transition-colors">
        <div>
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag & Drop Google Drive Files
          </p>
          <p className="text-sm text-gray-500">
            Drop Google Drive URLs here to import them
          </p>
        </div>
      </div>
    </DriveDragDropImporter>
  );
}