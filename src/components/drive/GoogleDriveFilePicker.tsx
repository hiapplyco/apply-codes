/**
 * Google Drive File Picker Component
 * 
 * A modal-based file picker for selecting Google Drive files
 * with support for multiple file types, search, and batch selection.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleDriveFile, GoogleMimeType } from '@/types/google-api';
import { GoogleDriveFileBrowser } from './GoogleDriveFileBrowser';
import { 
  useDriveFiles, 
  useRecentFiles, 
  useStarredFiles, 
  useSharedFiles 
} from '@/hooks/useDriveFiles';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Star, 
  Share2, 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  File,
  Search,
  Filter,
  X
} from 'lucide-react';

export interface GoogleDriveFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: GoogleDriveFile) => void;
  onFilesSelect?: (files: GoogleDriveFile[]) => void;
  multiSelect?: boolean;
  allowedTypes?: GoogleMimeType[];
  title?: string;
  description?: string;
  submitLabel?: string;
  showRecentFiles?: boolean;
  showStarredFiles?: boolean;
  showSharedFiles?: boolean;
  maxFiles?: number;
  className?: string;
}

type TabValue = 'browse' | 'recent' | 'starred' | 'shared';

const FILE_TYPE_GROUPS = {
  documents: {
    label: 'Documents',
    icon: FileText,
    types: [
      'application/vnd.google-apps.document',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ] as GoogleMimeType[]
  },
  spreadsheets: {
    label: 'Spreadsheets',
    icon: FileText,
    types: [
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ] as GoogleMimeType[]
  },
  presentations: {
    label: 'Presentations',
    icon: FileText,
    types: [
      'application/vnd.google-apps.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ] as GoogleMimeType[]
  },
  images: {
    label: 'Images',
    icon: Image,
    types: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/svg+xml'
    ] as GoogleMimeType[]
  },
  videos: {
    label: 'Videos',
    icon: Video,
    types: [
      'video/mp4',
      'video/quicktime',
      'video/avi',
      'video/mkv'
    ] as GoogleMimeType[]
  },
  audio: {
    label: 'Audio',
    icon: Music,
    types: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp3'
    ] as GoogleMimeType[]
  },
  archives: {
    label: 'Archives',
    icon: Archive,
    types: [
      'application/zip',
      'application/x-tar',
      'application/gzip'
    ] as GoogleMimeType[]
  },
  all: {
    label: 'All Files',
    icon: File,
    types: [] as GoogleMimeType[]
  }
};

export function GoogleDriveFilePicker({
  open,
  onOpenChange,
  onFileSelect,
  onFilesSelect,
  multiSelect = false,
  allowedTypes = [],
  title = 'Select from Google Drive',
  description,
  submitLabel = 'Select',
  showRecentFiles = true,
  showStarredFiles = true,
  showSharedFiles = true,
  maxFiles,
  className
}: GoogleDriveFilePickerProps) {
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);
  const [activeTab, setActiveTab] = useState<TabValue>('browse');
  const [selectedTypeGroup, setSelectedTypeGroup] = useState<string>('all');

  // Determine effective file type filter
  const effectiveAllowedTypes = useMemo(() => {
    if (allowedTypes.length > 0) return allowedTypes;
    if (selectedTypeGroup !== 'all') {
      return FILE_TYPE_GROUPS[selectedTypeGroup as keyof typeof FILE_TYPE_GROUPS]?.types || [];
    }
    return [];
  }, [allowedTypes, selectedTypeGroup]);

  // Handle file selection
  const handleFileSelect = useCallback((file: GoogleDriveFile) => {
    if (multiSelect) {
      setSelectedFiles(prev => {
        const isAlreadySelected = prev.some(f => f.id === file.id);
        
        if (isAlreadySelected) {
          return prev.filter(f => f.id !== file.id);
        }
        
        const newSelection = [...prev, file];
        
        // Check max files limit
        if (maxFiles && newSelection.length > maxFiles) {
          return prev; // Don't add if it would exceed limit
        }
        
        return newSelection;
      });
    } else {
      onFileSelect(file);
      onOpenChange(false);
    }
  }, [multiSelect, maxFiles, onFileSelect, onOpenChange]);

  // Handle files selection (for multi-select mode)
  const handleFilesSelect = useCallback((files: GoogleDriveFile[]) => {
    if (multiSelect) {
      let newSelection = files;
      
      // Check max files limit
      if (maxFiles && newSelection.length > maxFiles) {
        newSelection = newSelection.slice(0, maxFiles);
      }
      
      setSelectedFiles(newSelection);
    }
  }, [multiSelect, maxFiles]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (multiSelect && onFilesSelect) {
      onFilesSelect(selectedFiles);
    }
    onOpenChange(false);
  }, [multiSelect, onFilesSelect, selectedFiles, onOpenChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Remove file from selection
  const removeFromSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Check if file type is allowed
  const isFileTypeAllowed = useCallback((mimeType: string) => {
    if (effectiveAllowedTypes.length === 0) return true;
    return effectiveAllowedTypes.includes(mimeType as GoogleMimeType);
  }, [effectiveAllowedTypes]);

  // Get available file type groups based on allowed types
  const availableTypeGroups = useMemo(() => {
    if (allowedTypes.length === 0) {
      return Object.entries(FILE_TYPE_GROUPS);
    }

    return Object.entries(FILE_TYPE_GROUPS).filter(([key, group]) => {
      if (key === 'all') return true;
      return group.types.some(type => allowedTypes.includes(type));
    });
  }, [allowedTypes]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedFiles([]);
      setActiveTab('browse');
      setSelectedTypeGroup('all');
    }
  }, [open]);

  // Render file type filters
  const renderTypeFilters = () => (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700 mr-2">File Types:</span>
      {availableTypeGroups.map(([key, group]) => {
        const Icon = group.icon;
        const isSelected = selectedTypeGroup === key;
        
        return (
          <Button
            key={key}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTypeGroup(key)}
            className="h-8"
          >
            <Icon className="w-4 h-4 mr-1" />
            {group.label}
          </Button>
        );
      })}
    </div>
  );

  // Render selected files summary
  const renderSelectedFilesSummary = () => {
    if (!multiSelect || selectedFiles.length === 0) return null;

    return (
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">
            Selected Files ({selectedFiles.length}{maxFiles ? `/${maxFiles}` : ''})
          </h4>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear All
          </Button>
        </div>
        
        <div className="max-h-32 overflow-y-auto space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-gray-500" />
                <span className="truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromSelection(file.id)}
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
        
        {maxFiles && selectedFiles.length >= maxFiles && (
          <p className="text-xs text-amber-600 mt-2">
            Maximum number of files selected
          </p>
        )}
      </div>
    );
  };

  // Render tab content
  const renderTabContent = (tabValue: TabValue) => {
    switch (tabValue) {
      case 'browse':
        return (
          <GoogleDriveFileBrowser
            onFileSelect={handleFileSelect}
            onFilesSelect={handleFilesSelect}
            multiSelect={multiSelect}
            fileTypeFilter={effectiveAllowedTypes}
            height="400px"
            className="border-0"
          />
        );
      case 'recent':
        return <RecentFilesTab onFileSelect={handleFileSelect} allowedTypes={effectiveAllowedTypes} />;
      case 'starred':
        return <StarredFilesTab onFileSelect={handleFileSelect} allowedTypes={effectiveAllowedTypes} />;
      case 'shared':
        return <SharedFilesTab onFileSelect={handleFileSelect} allowedTypes={effectiveAllowedTypes} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[80vh]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {renderTypeFilters()}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse" className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4" />
                <span>Browse</span>
              </TabsTrigger>
              {showRecentFiles && (
                <TabsTrigger value="recent" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Recent</span>
                </TabsTrigger>
              )}
              {showStarredFiles && (
                <TabsTrigger value="starred" className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </TabsTrigger>
              )}
              {showSharedFiles && (
                <TabsTrigger value="shared" className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Shared</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-4 h-[400px] overflow-hidden">
              <TabsContent value="browse" className="h-full m-0">
                {renderTabContent('browse')}
              </TabsContent>
              {showRecentFiles && (
                <TabsContent value="recent" className="h-full m-0">
                  {renderTabContent('recent')}
                </TabsContent>
              )}
              {showStarredFiles && (
                <TabsContent value="starred" className="h-full m-0">
                  {renderTabContent('starred')}
                </TabsContent>
              )}
              {showSharedFiles && (
                <TabsContent value="shared" className="h-full m-0">
                  {renderTabContent('shared')}
                </TabsContent>
              )}
            </div>
          </Tabs>

          {renderSelectedFilesSummary()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {multiSelect && (
            <Button 
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0}
            >
              {submitLabel} ({selectedFiles.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Recent Files Tab Component
function RecentFilesTab({ 
  onFileSelect, 
  allowedTypes 
}: { 
  onFileSelect: (file: GoogleDriveFile) => void;
  allowedTypes: GoogleMimeType[];
}) {
  const { data: recentFiles, isLoading, isError } = useRecentFiles(20);

  const filteredFiles = useMemo(() => {
    if (!recentFiles) return [];
    
    if (allowedTypes.length === 0) return recentFiles;
    
    return recentFiles.filter(file => 
      allowedTypes.includes(file.mimeType as GoogleMimeType)
    );
  }, [recentFiles, allowedTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading recent files...</p>
        </div>
      </div>
    );
  }

  if (isError || filteredFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2" />
          <p>No recent files found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 p-2">
      {filteredFiles.map((file) => (
        <FileListItem key={file.id} file={file} onSelect={onFileSelect} />
      ))}
    </div>
  );
}

// Starred Files Tab Component
function StarredFilesTab({ 
  onFileSelect, 
  allowedTypes 
}: { 
  onFileSelect: (file: GoogleDriveFile) => void;
  allowedTypes: GoogleMimeType[];
}) {
  const { data: starredFiles, isLoading, isError } = useStarredFiles();

  const filteredFiles = useMemo(() => {
    if (!starredFiles) return [];
    
    if (allowedTypes.length === 0) return starredFiles;
    
    return starredFiles.filter(file => 
      allowedTypes.includes(file.mimeType as GoogleMimeType)
    );
  }, [starredFiles, allowedTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading starred files...</p>
        </div>
      </div>
    );
  }

  if (isError || filteredFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-2" />
          <p>No starred files found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 p-2">
      {filteredFiles.map((file) => (
        <FileListItem key={file.id} file={file} onSelect={onFileSelect} />
      ))}
    </div>
  );
}

// Shared Files Tab Component
function SharedFilesTab({ 
  onFileSelect, 
  allowedTypes 
}: { 
  onFileSelect: (file: GoogleDriveFile) => void;
  allowedTypes: GoogleMimeType[];
}) {
  const { data: sharedFiles, isLoading, isError } = useSharedFiles();

  const filteredFiles = useMemo(() => {
    if (!sharedFiles) return [];
    
    if (allowedTypes.length === 0) return sharedFiles;
    
    return sharedFiles.filter(file => 
      allowedTypes.includes(file.mimeType as GoogleMimeType)
    );
  }, [sharedFiles, allowedTypes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading shared files...</p>
        </div>
      </div>
    );
  }

  if (isError || filteredFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Share2 className="w-12 h-12 mx-auto mb-2" />
          <p>No shared files found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 p-2">
      {filteredFiles.map((file) => (
        <FileListItem key={file.id} file={file} onSelect={onFileSelect} />
      ))}
    </div>
  );
}

// File List Item Component
function FileListItem({ 
  file, 
  onSelect 
}: { 
  file: GoogleDriveFile;
  onSelect: (file: GoogleDriveFile) => void;
}) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return FolderOpen;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('zip') || mimeType.includes('tar')) return Archive;
    return FileText;
  };

  const Icon = getFileIcon(file.mimeType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect(file)}
    >
      <Icon className="w-8 h-8 text-gray-500 mr-3" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{file.name}</h4>
        <p className="text-sm text-gray-500">
          Modified {formatDate(file.modifiedTime)}
        </p>
      </div>

      {file.starred && (
        <Star className="w-4 h-4 text-yellow-500 fill-current ml-2" />
      )}
    </div>
  );
}