/**
 * Drive File Importer for Tiptap Editor
 * 
 * Component for importing Google Drive files into Tiptap editor
 * with support for various file types and conversion options.
 */

import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Button
} from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GoogleDriveFile, GoogleMimeType } from '@/types/google-api';
import { GoogleDriveFilePicker } from './GoogleDriveFilePicker';
import { useDriveOperations } from '@/hooks/useDriveOperations';
import { 
  getFileTypeInfo,
  isGoogleWorkspaceFile,
  getExportFormats,
  extractTextFromDocument,
  convertDocumentToHtml,
  convertDocumentToMarkdown,
  downloadAndConvertFile
} from '@/utils/driveFileUtils';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Download, 
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface DriveFileImporterProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowedTypes?: GoogleMimeType[];
  onImportComplete?: (file: GoogleDriveFile, content: string) => void;
}

interface ImportJob {
  id: string;
  file: GoogleDriveFile;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: string;
  error?: string;
  format?: string;
}

const SUPPORTED_IMPORT_TYPES: GoogleMimeType[] = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/pdf',
  'text/plain',
  'text/html',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml'
];

const IMPORT_FORMAT_OPTIONS = {
  'application/vnd.google-apps.document': [
    { value: 'html', label: 'Rich Text (HTML)', recommended: true },
    { value: 'markdown', label: 'Markdown' },
    { value: 'text', label: 'Plain Text' }
  ],
  'application/vnd.google-apps.spreadsheet': [
    { value: 'html', label: 'Table (HTML)', recommended: true },
    { value: 'csv', label: 'CSV Data' }
  ],
  'application/vnd.google-apps.presentation': [
    { value: 'html', label: 'Slides Content (HTML)', recommended: true },
    { value: 'text', label: 'Text Only' }
  ],
  'text/plain': [
    { value: 'text', label: 'Plain Text', recommended: true }
  ],
  'text/html': [
    { value: 'html', label: 'HTML', recommended: true }
  ],
  'text/markdown': [
    { value: 'markdown', label: 'Markdown', recommended: true }
  ]
};

export function DriveFileImporter({
  editor,
  open,
  onOpenChange,
  allowedTypes = SUPPORTED_IMPORT_TYPES,
  onImportComplete
}: DriveFileImporterProps) {
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [importFormat, setImportFormat] = useState<string>('');
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const operations = useDriveOperations();

  // Filter allowed types to only supported ones
  const effectiveAllowedTypes = allowedTypes.filter(type => 
    SUPPORTED_IMPORT_TYPES.includes(type)
  );

  // Handle file selection from picker
  const handleFileSelect = useCallback((file: GoogleDriveFile) => {
    setSelectedFile(file);
    setShowFilePicker(false);

    // Set default import format
    const formats = IMPORT_FORMAT_OPTIONS[file.mimeType as keyof typeof IMPORT_FORMAT_OPTIONS];
    if (formats) {
      const recommended = formats.find(f => f.recommended);
      setImportFormat(recommended?.value || formats[0].value);
    }
  }, []);

  // Import single file
  const importFile = useCallback(async (file: GoogleDriveFile, format: string) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    const jobId = `import-${Date.now()}-${Math.random()}`;
    const job: ImportJob = {
      id: jobId,
      file,
      status: 'pending',
      progress: 0,
      format
    };

    setImportJobs(prev => [...prev, job]);
    setIsImporting(true);

    try {
      // Update job status
      setImportJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'processing' as const, progress: 20 }
          : j
      ));

      let content = '';
      const fileTypeInfo = getFileTypeInfo(file.mimeType);

      // Process based on file type and format
      if (file.mimeType === 'application/vnd.google-apps.document') {
        setImportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress: 40 } : j
        ));

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
        setImportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress: 40 } : j
        ));

        if (format === 'csv') {
          content = await operations.exportFile(file.id, 'text/csv' as GoogleMimeType);
        } else {
          // Convert to HTML table
          content = await operations.exportFile(file.id, 'text/html' as GoogleMimeType);
        }
      } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
        setImportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress: 40 } : j
        ));

        if (format === 'text') {
          content = await operations.exportFile(file.id, 'text/plain' as GoogleMimeType);
        } else {
          content = await operations.exportFile(file.id, 'text/html' as GoogleMimeType);
        }
      } else if (fileTypeInfo.category === 'image') {
        setImportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress: 60 } : j
        ));

        // For images, insert directly into editor
        if (file.webContentLink) {
          editor.chain().focus().setImage({ src: file.webContentLink, alt: file.name }).run();
          content = `![${file.name}](${file.webContentLink})`;
        }
      } else if (file.mimeType.startsWith('text/')) {
        setImportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, progress: 40 } : j
        ));

        content = await operations.downloadFile(file.id);
      } else {
        throw new Error(`Unsupported file type: ${file.mimeType}`);
      }

      setImportJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, progress: 80 } : j
      ));

      // Insert content into editor
      if (content && format !== 'image') {
        if (format === 'html') {
          editor.commands.insertContent(content);
        } else if (format === 'markdown') {
          // Convert markdown to HTML for Tiptap
          // You might want to use a markdown parser here
          editor.commands.insertContent(`<pre>${content}</pre>`);
        } else {
          editor.commands.insertContent(`<p>${content.replace(/\n/g, '</p><p>')}</p>`);
        }
      }

      setImportJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'completed' as const, progress: 100, result: content }
          : j
      ));

      onImportComplete?.(file, content);
      toast.success(`Imported "${file.name}" successfully`);

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setImportJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, status: 'error' as const, error: errorMessage }
          : j
      ));

      toast.error(`Failed to import "${file.name}": ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  }, [editor, operations, onImportComplete]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedFile || !importFormat) return;

    await importFile(selectedFile, importFormat);
    
    // Reset state
    setSelectedFile(null);
    setImportFormat('');
  }, [selectedFile, importFormat, importFile]);

  // Remove completed job
  const removeJob = useCallback((jobId: string) => {
    setImportJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  // Clear all jobs
  const clearAllJobs = useCallback(() => {
    setImportJobs([]);
  }, []);

  // Get format options for selected file
  const formatOptions = selectedFile 
    ? IMPORT_FORMAT_OPTIONS[selectedFile.mimeType as keyof typeof IMPORT_FORMAT_OPTIONS] || []
    : [];

  // Render job status
  const renderJobStatus = (job: ImportJob) => {
    const getStatusIcon = () => {
      switch (job.status) {
        case 'pending':
          return <Clock className="w-4 h-4 text-gray-500" />;
        case 'processing':
          return <div className="w-4 h-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />;
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
      }
    };

    const getStatusColor = () => {
      switch (job.status) {
        case 'pending':
          return 'bg-gray-100';
        case 'processing':
          return 'bg-blue-50 border-blue-200';
        case 'completed':
          return 'bg-green-50 border-green-200';
        case 'error':
          return 'bg-red-50 border-red-200';
      }
    };

    return (
      <div className={`p-3 border rounded-lg ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">{job.file.name}</span>
            <Badge variant="outline" className="text-xs">
              {job.format}
            </Badge>
          </div>
          
          {job.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeJob(job.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {job.status === 'processing' && (
          <Progress value={job.progress} className="h-2" />
        )}

        {job.status === 'error' && job.error && (
          <p className="text-xs text-red-600 mt-1">{job.error}</p>
        )}

        {job.status === 'completed' && (
          <p className="text-xs text-green-600 mt-1">
            Imported successfully
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from Google Drive</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select File
              </label>
              
              {selectedFile ? (
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{selectedFile.name}</h4>
                        <p className="text-sm text-gray-600">
                          {getFileTypeInfo(selectedFile.mimeType).label}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilePicker(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowFilePicker(true)}
                  className="w-full h-20 border-dashed"
                >
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span>Choose file from Google Drive</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Format Selection */}
            {selectedFile && formatOptions.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Import Format
                </label>
                
                <Select value={importFormat} onValueChange={setImportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose import format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <span>{option.label}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <p className="text-xs text-gray-600 mt-1">
                  Choose how the file content should be imported into the editor
                </p>
              </div>
            )}

            {/* Import Jobs */}
            {importJobs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Import Progress</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllJobs}
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importJobs.map(renderJobStatus)}
                </div>
              </div>
            )}

            {/* Warnings */}
            {selectedFile && !isGoogleWorkspaceFile(selectedFile.mimeType) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This file type may have limited import options. 
                  Google Workspace files (Docs, Sheets, Slides) provide the best import experience.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || !importFormat || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Picker Dialog */}
      <GoogleDriveFilePicker
        open={showFilePicker}
        onOpenChange={setShowFilePicker}
        onFileSelect={handleFileSelect}
        allowedTypes={effectiveAllowedTypes}
        title="Select File to Import"
        description="Choose a file from your Google Drive to import into the editor"
      />
    </>
  );
}

/**
 * Hook for using Drive File Importer
 */
export function useDriveFileImporter(editor: Editor | null) {
  const [open, setOpen] = useState(false);

  const openImporter = useCallback(() => {
    setOpen(true);
  }, []);

  const closeImporter = useCallback(() => {
    setOpen(false);
  }, []);

  const ImporterComponent = useCallback((props: Partial<DriveFileImporterProps>) => (
    <DriveFileImporter
      editor={editor}
      open={open}
      onOpenChange={setOpen}
      {...props}
    />
  ), [editor, open]);

  return {
    openImporter,
    closeImporter,
    ImporterComponent,
    isOpen: open
  };
}