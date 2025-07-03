/**
 * Google Drive Integration Examples
 * 
 * Comprehensive examples demonstrating how to use the Google Drive
 * integration components and hooks in various scenarios.
 */

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { GoogleDriveFile } from '@/types/google-api';
import { GoogleDriveFileBrowser } from '@/components/drive/GoogleDriveFileBrowser';
import { GoogleDriveFilePicker } from '@/components/drive/GoogleDriveFilePicker';
import { DriveFileImporter, useDriveFileImporter } from '@/components/drive/DriveFileImporter';
import { 
  DriveDragDropImporter, 
  useDriveDragDrop,
  DriveDragDropZone 
} from '@/components/drive/DriveDragDropImporter';
import { 
  useDriveFiles, 
  useDriveFile, 
  useRecentFiles,
  useStarredFiles,
  useFileSearch
} from '@/hooks/useDriveFiles';
import { useDriveUpload, useDriveFileInput } from '@/hooks/useDriveUpload';
import { useDriveOperations } from '@/hooks/useDriveOperations';
import { 
  getFileTypeInfo,
  formatFileSize,
  formatFileDate,
  filterFiles,
  sortFiles
} from '@/utils/driveFileUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Search, 
  Download,
  Star,
  Folder,
  Image
} from 'lucide-react';

/**
 * Example 1: Basic File Browser
 */
export function BasicFileBrowserExample() {
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Folder className="w-5 h-5" />
          <span>Basic File Browser</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleDriveFileBrowser
          onFileSelect={setSelectedFile}
          allowUpload={true}
          allowFolderCreation={true}
          height="400px"
        />
        
        {selectedFile && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-2">Selected File:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {selectedFile.name}
              </div>
              <div>
                <strong>Type:</strong> {getFileTypeInfo(selectedFile.mimeType).label}
              </div>
              <div>
                <strong>Size:</strong> {selectedFile.size ? formatFileSize(selectedFile.size) : 'N/A'}
              </div>
              <div>
                <strong>Modified:</strong> {formatFileDate(selectedFile.modifiedTime)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: File Picker Modal
 */
export function FilePickerModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<GoogleDriveFile[]>([]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>File Picker Modal</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)}>
            Open File Picker
          </Button>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-2 p-2 border rounded">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <Badge variant="outline">{getFileTypeInfo(file.mimeType).label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <GoogleDriveFilePicker
            open={isOpen}
            onOpenChange={setIsOpen}
            onFileSelect={(file) => setSelectedFiles([file])}
            onFilesSelect={setSelectedFiles}
            multiSelect={true}
            maxFiles={5}
            allowedTypes={[
              'application/vnd.google-apps.document',
              'application/vnd.google-apps.spreadsheet',
              'application/pdf',
              'image/jpeg',
              'image/png'
            ]}
            title="Select Documents and Images"
            description="Choose up to 5 files from your Google Drive"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: File Upload with Progress
 */
export function FileUploadExample() {
  const upload = useDriveFileInput({
    multiple: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    autoUpload: true,
    onComplete: (file) => {
      console.log('Upload completed:', file);
    },
    onError: (error, fileName) => {
      console.error('Upload failed:', fileName, error);
    }
  });

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>File Upload with Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={upload.openFileDialog}>
            Select Files to Upload
          </Button>

          {upload.uploadProgress.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Upload Progress:</h4>
              <div className="space-y-2">
                {upload.uploadProgress.map((progress) => (
                  <div key={progress.fileId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{progress.fileName}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <upload.FileInput />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Drag & Drop Import
 */
export function DragDropImportExample() {
  const [importedFiles, setImportedFiles] = useState<GoogleDriveFile[]>([]);

  const handleFileImport = (file: GoogleDriveFile, content: string) => {
    setImportedFiles(prev => [...prev, file]);
    console.log('Imported content:', content);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Drag & Drop Import</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DriveDragDropZone
            onFileImport={handleFileImport}
            importFormat="html"
            autoImport={true}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8"
          />

          {importedFiles.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Imported Files:</h4>
              <div className="space-y-2">
                {importedFiles.map((file) => (
                  <div key={`${file.id}-${Date.now()}`} className="flex items-center space-x-2 p-2 border rounded bg-green-50">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span>{file.name}</span>
                    <Badge variant="outline" className="bg-green-100">Imported</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Search and Filter
 */
export function SearchAndFilterExample() {
  const { searchFiles, searchResults, isSearching } = useFileSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<GoogleDriveFile[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchFiles(query, {
        mimeType: 'application/vnd.google-apps.document'
      });
    }
  };

  React.useEffect(() => {
    // Apply additional filters
    const filtered = filterFiles(searchResults, {
      sizeLimitBytes: 10 * 1024 * 1024, // 10MB limit
      starred: undefined // Show all
    });
    
    const sorted = sortFiles(filtered, 'modified', 'desc');
    setFilteredResults(sorted);
  }, [searchResults]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Search and Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search Google Docs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            {isSearching && (
              <div className="px-3 py-2">Searching...</div>
            )}
          </div>

          {filteredResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">
                Search Results ({filteredResults.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredResults.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileDate(file.modifiedTime)} • {file.size ? formatFileSize(file.size) : 'Unknown size'}
                        </div>
                      </div>
                    </div>
                    {file.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 6: File Operations
 */
export function FileOperationsExample() {
  const { data: recentFiles } = useRecentFiles(10);
  const operations = useDriveOperations();

  const handleStarToggle = async (file: GoogleDriveFile) => {
    await operations.toggleStar(file.id, !file.starred);
  };

  const handleCopyFile = async (file: GoogleDriveFile) => {
    await operations.copyFile(file.id, `Copy of ${file.name}`);
  };

  const handleDownload = async (file: GoogleDriveFile) => {
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
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>File Operations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentFiles && recentFiles.length > 0 ? (
          <div className="space-y-2">
            {recentFiles.slice(0, 5).map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {getFileTypeInfo(file.mimeType).label}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStarToggle(file)}
                  >
                    <Star className={`w-4 h-4 ${file.starred ? 'text-yellow-500 fill-current' : ''}`} />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyFile(file)}
                  >
                    Copy
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent files found</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example 7: Custom Hook Usage
 */
export function CustomHookExample() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Use multiple hooks together
  const { files, isLoading, refetch } = useDriveFiles({
    folderId: selectedFolderId,
    pageSize: 20,
    orderBy: 'name'
  });
  
  const { data: starredFiles } = useStarredFiles();
  const { data: recentFiles } = useRecentFiles(5);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Custom Hook Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="folder">
          <TabsList>
            <TabsTrigger value="folder">Current Folder</TabsTrigger>
            <TabsTrigger value="starred">Starred Files</TabsTrigger>
            <TabsTrigger value="recent">Recent Files</TabsTrigger>
          </TabsList>
          
          <TabsContent value="folder" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">
                Folder Contents ({files.length} files)
              </h4>
              <Button onClick={refetch} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.slice(0, 6).map((file) => (
                <div key={file.id} className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    {file.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Folder className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatFileDate(file.modifiedTime)}
                  </p>
                  {file.mimeType === 'application/vnd.google-apps.folder' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => setSelectedFolderId(file.id)}
                    >
                      Open Folder
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="starred">
            <h4 className="font-medium mb-4">
              Starred Files ({starredFiles?.length || 0})
            </h4>
            <div className="space-y-2">
              {starredFiles?.slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent">
            <h4 className="font-medium mb-4">
              Recent Files ({recentFiles?.length || 0})
            </h4>
            <div className="space-y-2">
              {recentFiles?.map((file) => (
                <div key={file.id} className="flex items-center space-x-2 p-2 border rounded">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>{file.name}</span>
                  <Badge variant="outline">{formatFileDate(file.modifiedTime, true)}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Main Examples Component
 */
export function GoogleDriveIntegrationExamples() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Google Drive Integration Examples</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive examples showing how to integrate Google Drive functionality
          into your React applications using our components and hooks.
        </p>
      </div>

      <div className="grid gap-8">
        <BasicFileBrowserExample />
        <FilePickerModalExample />
        <FileUploadExample />
        <DragDropImportExample />
        <SearchAndFilterExample />
        <FileOperationsExample />
        <CustomHookExample />
      </div>
    </div>
  );
}