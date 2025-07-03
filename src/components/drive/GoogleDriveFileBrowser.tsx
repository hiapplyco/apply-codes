/**
 * Google Drive File Browser Component
 * 
 * A comprehensive file browser for navigating and managing Google Drive files
 * with support for multiple views, search, filtering, and batch operations.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Folder, 
  File, 
  Star, 
  StarOff,
  Grid3x3,
  List,
  Search,
  Filter,
  Upload,
  RefreshCw,
  MoreVertical,
  Download,
  Share2,
  Copy,
  Move,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Calendar,
  SortAsc,
  SortDesc,
  X
} from 'lucide-react';
import { GoogleDriveFile, GoogleMimeType } from '@/types/google-api';
import { 
  useDriveFiles, 
  useFileSearch, 
  useFileTypeFilter, 
  useFileSorting 
} from '@/hooks/useDriveFiles';
import { useDriveOperations } from '@/hooks/useDriveOperations';
import { useDriveDropUpload } from '@/hooks/useDriveUpload';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface GoogleDriveFileBrowserProps {
  onFileSelect?: (file: GoogleDriveFile) => void;
  onFilesSelect?: (files: GoogleDriveFile[]) => void;
  onFolderNavigate?: (folderId: string | null) => void;
  multiSelect?: boolean;
  allowUpload?: boolean;
  allowFolderCreation?: boolean;
  fileTypeFilter?: GoogleMimeType[];
  initialFolderId?: string;
  height?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';

interface NavigationItem {
  id: string | null;
  name: string;
}

const MIME_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  'application/vnd.google-apps.folder': Folder,
  'application/vnd.google-apps.document': FileText,
  'application/vnd.google-apps.spreadsheet': Calendar,
  'application/vnd.google-apps.presentation': FileText,
  'application/pdf': FileText,
  'image/': Image,
  'video/': Video,
  'audio/': Music,
  'application/zip': Archive,
  'text/': Code,
  default: File
};

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/vnd.google-apps.document': 'Google Docs',
  'application/vnd.google-apps.spreadsheet': 'Google Sheets',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/vnd.google-apps.folder': 'Folder',
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'text/plain': 'Text File',
  'application/zip': 'ZIP Archive'
};

export function GoogleDriveFileBrowser({
  onFileSelect,
  onFilesSelect,
  onFolderNavigate,
  multiSelect = false,
  allowUpload = false,
  allowFolderCreation = false,
  fileTypeFilter = [],
  initialFolderId,
  height = '600px',
  className
}: GoogleDriveFileBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [navigationHistory, setNavigationHistory] = useState<NavigationItem[]>([
    { id: null, name: 'My Drive' }
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Hooks
  const { selectedTypes, toggleType, clearTypes, isTypeSelected } = useFileTypeFilter();
  const { sortBy, setSortBy, sortOptions, getSortLabel } = useFileSorting();
  const { searchFiles, searchResults, isSearching, clearSearch } = useFileSearch();
  const operations = useDriveOperations();
  const upload = useDriveDropUpload(currentFolderId || undefined);

  // Build search parameters
  const searchParams = useMemo(() => {
    const params: any = {
      folderId: searchQuery ? undefined : currentFolderId,
      searchQuery: searchQuery || undefined,
      orderBy: sortBy,
      mimeType: selectedTypes.length === 1 ? selectedTypes[0] : undefined
    };

    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    );
  }, [currentFolderId, searchQuery, sortBy, selectedTypes]);

  // Fetch files
  const {
    files,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useDriveFiles(searchParams);

  // Filter files based on type filters
  const filteredFiles = useMemo(() => {
    let result = searchQuery ? searchResults : files;

    if (fileTypeFilter.length > 0) {
      result = result.filter(file => fileTypeFilter.includes(file.mimeType as GoogleMimeType));
    }

    if (selectedTypes.length > 0) {
      result = result.filter(file => selectedTypes.includes(file.mimeType as GoogleMimeType));
    }

    return result;
  }, [files, searchResults, searchQuery, fileTypeFilter, selectedTypes]);

  // Handle folder navigation
  const navigateToFolder = useCallback((folderId: string | null, folderName: string = 'Unknown') => {
    setCurrentFolderId(folderId);
    setSelectedFiles(new Set());
    setSearchQuery('');
    clearSearch();

    // Update navigation history
    const newItem = { id: folderId, name: folderName };
    setNavigationHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === folderId);
      if (existingIndex >= 0) {
        return prev.slice(0, existingIndex + 1);
      }
      return [...prev, newItem];
    });

    onFolderNavigate?.(folderId);
  }, [onFolderNavigate, clearSearch]);

  // Handle file selection
  const handleFileSelect = useCallback((file: GoogleDriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      navigateToFolder(file.id, file.name);
      return;
    }

    if (multiSelect) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(file.id)) {
          newSet.delete(file.id);
        } else {
          newSet.add(file.id);
        }
        
        const selectedFileObjects = filteredFiles.filter(f => newSet.has(f.id));
        onFilesSelect?.(selectedFileObjects);
        
        return newSet;
      });
    } else {
      onFileSelect?.(file);
    }
  }, [multiSelect, navigateToFolder, onFileSelect, onFilesSelect, filteredFiles]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchFiles(query, {
        mimeType: selectedTypes.length === 1 ? selectedTypes[0] : undefined
      });
    } else {
      clearSearch();
    }
  }, [searchFiles, clearSearch, selectedTypes]);

  // Handle file operations
  const handleStarToggle = useCallback(async (file: GoogleDriveFile, e: React.MouseEvent) => {
    e.stopPropagation();
    await operations.toggleStar(file.id, !file.starred);
  }, [operations]);

  const handleFileDownload = useCallback(async (file: GoogleDriveFile) => {
    try {
      const content = await operations.downloadFile(file.id);
      
      // Create download link
      const blob = new Blob([content], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [operations]);

  // Get file icon
  const getFileIcon = useCallback((mimeType: string) => {
    for (const [type, Icon] of Object.entries(MIME_TYPE_ICONS)) {
      if (mimeType.startsWith(type) || mimeType === type) {
        return Icon;
      }
    }
    return MIME_TYPE_ICONS.default;
  }, []);

  // Format file size
  const formatFileSize = useCallback((size?: string) => {
    if (!size) return '';
    
    const bytes = parseInt(size);
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let fileSize = bytes;
    
    while (fileSize >= 1024 && i < units.length - 1) {
      fileSize /= 1024;
      i++;
    }
    
    return `${fileSize.toFixed(1)} ${units[i]}`;
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  // Handle drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (allowUpload && e.dataTransfer?.files) {
        const files = Array.from(e.dataTransfer.files);
        upload.uploadFiles(files, currentFolderId || undefined);
      }
    };

    if (allowUpload) {
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('drop', handleDrop);

      return () => {
        document.removeEventListener('dragover', handleDragOver);
        document.removeEventListener('dragleave', handleDragLeave);
        document.removeEventListener('drop', handleDrop);
      };
    }
  }, [allowUpload, upload, currentFolderId]);

  // Render navigation breadcrumb
  const renderBreadcrumb = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {navigationHistory.map((item, index) => (
        <React.Fragment key={item.id || 'root'}>
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (item.id !== currentFolderId) {
                navigateToFolder(item.id, item.name);
              }
            }}
            className={cn(
              "p-1 h-auto",
              item.id === currentFolderId && "font-semibold"
            )}
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );

  // Render toolbar
  const renderToolbar = () => (
    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 w-64"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="p-2">
              <h4 className="font-medium mb-2">File Types</h4>
              {[
                'application/vnd.google-apps.document',
                'application/vnd.google-apps.spreadsheet',
                'application/vnd.google-apps.presentation',
                'application/pdf',
                'image/jpeg',
                'text/plain'
              ].map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={isTypeSelected(type as GoogleMimeType)}
                  onCheckedChange={() => toggleType(type as GoogleMimeType)}
                >
                  {FILE_TYPE_LABELS[type] || type}
                </DropdownMenuCheckboxItem>
              ))}
              {selectedTypes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearTypes}>
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {sortBy.includes('desc') ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />}
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
              >
                {option.label}
                {sortBy === option.value && ' ✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center space-x-2">
        {/* View mode toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>

        {/* Upload (if enabled) */}
        {allowUpload && (
          <Button
            variant="outline"
            size="sm"
            onClick={upload.openFileDialog}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );

  // Render file item
  const renderFileItem = (file: GoogleDriveFile) => {
    const Icon = getFileIcon(file.mimeType);
    const isSelected = selectedFiles.has(file.id);
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

    if (viewMode === 'grid') {
      return (
        <div
          key={file.id}
          className={cn(
            "relative group p-4 border rounded-lg cursor-pointer transition-all",
            "hover:border-purple-300 hover:shadow-md",
            isSelected && "border-purple-500 bg-purple-50",
            isDragOver && allowUpload && "border-dashed border-blue-400"
          )}
          onClick={() => handleFileSelect(file)}
        >
          {multiSelect && (
            <Checkbox
              checked={isSelected}
              className="absolute top-2 left-2 z-10"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="flex flex-col items-center text-center">
            <Icon className={cn(
              "w-12 h-12 mb-2",
              isFolder ? "text-blue-500" : "text-gray-500"
            )} />
            
            <h3 className="font-medium text-sm truncate w-full mb-1">
              {file.name}
            </h3>
            
            <div className="text-xs text-gray-500 space-y-1">
              {file.size && (
                <div>{formatFileSize(file.size)}</div>
              )}
              <div>{formatDate(file.modifiedTime)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFileSelect?.(file)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStarToggle(file, e)}>
                  {file.starred ? (
                    <>
                      <StarOff className="w-4 h-4 mr-2" />
                      Unstar
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Star
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => operations.deleteFile(file.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Star indicator */}
          {file.starred && (
            <Star className="absolute bottom-2 right-2 w-4 h-4 text-yellow-500 fill-current" />
          )}
        </div>
      );
    }

    // List view
    return (
      <div
        key={file.id}
        className={cn(
          "flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors",
          isSelected && "bg-purple-50 border-purple-200"
        )}
        onClick={() => handleFileSelect(file)}
      >
        {multiSelect && (
          <Checkbox
            checked={isSelected}
            className="mr-3"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <Icon className={cn(
          "w-6 h-6 mr-3",
          isFolder ? "text-blue-500" : "text-gray-500"
        )} />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{file.name}</h3>
          <p className="text-sm text-gray-500">
            {FILE_TYPE_LABELS[file.mimeType] || file.mimeType}
          </p>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {file.size && (
            <span>{formatFileSize(file.size)}</span>
          )}
          <span>{formatDate(file.modifiedTime)}</span>
          
          {file.starred && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onFileSelect?.(file)}>
                <Eye className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFileDownload(file)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStarToggle(file, e)}>
                {file.starred ? (
                  <>
                    <StarOff className="w-4 h-4 mr-2" />
                    Unstar
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Star
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => operations.deleteFile(file.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render loading state
  if (isLoading && filteredFiles.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)} style={{ height }}>
        <div className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className={cn("border rounded-lg p-6", className)} style={{ height }}>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load files: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg", className)} style={{ height }}>
      <div className="p-4 h-full flex flex-col">
        {renderBreadcrumb()}
        {renderToolbar()}

        {/* File listing */}
        <div className="flex-1 overflow-auto">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Folder className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium mb-2">
                {searchQuery ? 'No files found' : 'This folder is empty'}
              </p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : allowUpload ? 'Upload files to get started' : ''
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFiles.map(renderFileItem)}
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredFiles.map(renderFileItem)}
                </div>
              )}

              {/* Load more */}
              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={fetchNextPage}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selection summary */}
        {multiSelect && selectedFiles.size > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedFiles.size} file{selectedFiles.size === 1 ? '' : 's'} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload file input */}
      {allowUpload && <upload.FileInput />}

      {/* Drag overlay */}
      {isDragOver && allowUpload && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-400 flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-blue-700">Drop files to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}