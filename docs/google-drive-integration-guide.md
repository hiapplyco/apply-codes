# Google Drive Integration Guide

A comprehensive guide for integrating Google Drive functionality into your React applications using our powerful components and hooks.

## Table of Contents

1. [Overview](#overview)
2. [Setup and Configuration](#setup-and-configuration)
3. [Core Components](#core-components)
4. [Custom Hooks](#custom-hooks)
5. [Utilities](#utilities)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

Our Google Drive integration provides a complete solution for working with Google Drive files in React applications. It includes:

- **File browsing and management**
- **File uploading with progress tracking**
- **Drag-and-drop support**
- **Content import into editors (Tiptap)**
- **Advanced caching for performance**
- **TypeScript support throughout**

### Key Features

- 🚀 **High Performance**: Intelligent caching and optimized API calls
- 🎨 **Beautiful UI**: Pre-built components with modern design
- 🔧 **Flexible**: Highly customizable and extensible
- 📱 **Responsive**: Works seamlessly across devices
- 🛡️ **Type Safe**: Full TypeScript support
- ♿ **Accessible**: ARIA compliant components

## Setup and Configuration

### 1. Prerequisites

Ensure you have the following dependencies installed:

```bash
npm install @tanstack/react-query lucide-react sonner
```

### 2. Google API Configuration

First, set up your Google API credentials in your environment:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_CLOUD_PRIVATE_KEY=your_private_key
GOOGLE_CLOUD_CLIENT_EMAIL=your_client_email
GOOGLE_CLOUD_CLIENT_ID=your_client_id
GOOGLE_CLOUD_CLIENT_X509_CERT_URL=your_cert_url
```

### 3. Initialize the Service

Initialize the Google Drive service in your app:

```typescript
import { googleDriveService } from '@/lib/GoogleDriveService';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

function App() {
  const { accessToken, isAuthenticated } = useGoogleAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      googleDriveService.initialize(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  return (
    // Your app content
  );
}
```

## Core Components

### GoogleDriveFileBrowser

A comprehensive file browser for navigating Google Drive files.

```typescript
import { GoogleDriveFileBrowser } from '@/components/drive/GoogleDriveFileBrowser';

function MyComponent() {
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <GoogleDriveFileBrowser
      onFileSelect={setSelectedFile}
      onFolderNavigate={(folderId) => console.log('Navigated to:', folderId)}
      multiSelect={false}
      allowUpload={true}
      allowFolderCreation={true}
      fileTypeFilter={['application/vnd.google-apps.document']}
      height="600px"
    />
  );
}
```

**Props:**
- `onFileSelect`: Callback when a file is selected
- `onFilesSelect`: Callback for multiple file selection
- `onFolderNavigate`: Callback when navigating to a folder
- `multiSelect`: Enable multiple file selection
- `allowUpload`: Show upload functionality
- `allowFolderCreation`: Allow creating new folders
- `fileTypeFilter`: Restrict file types
- `height`: Component height

### GoogleDriveFilePicker

A modal-based file picker for selecting files from Google Drive.

```typescript
import { GoogleDriveFilePicker } from '@/components/drive/GoogleDriveFilePicker';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Select Files
      </button>
      
      <GoogleDriveFilePicker
        open={isOpen}
        onOpenChange={setIsOpen}
        onFileSelect={(file) => console.log('Selected:', file)}
        onFilesSelect={setSelectedFiles}
        multiSelect={true}
        allowedTypes={[
          'application/vnd.google-apps.document',
          'application/pdf',
          'image/jpeg'
        ]}
        maxFiles={5}
        title="Select Documents"
        description="Choose up to 5 files"
        submitLabel="Import Files"
      />
    </>
  );
}
```

### DriveFileImporter

Import Google Drive files into Tiptap editor with format conversion.

```typescript
import { DriveFileImporter, useDriveFileImporter } from '@/components/drive/DriveFileImporter';

function EditorComponent({ editor }) {
  const { openImporter, ImporterComponent } = useDriveFileImporter(editor);

  return (
    <>
      <button onClick={openImporter}>
        Import from Drive
      </button>
      
      <ImporterComponent
        allowedTypes={[
          'application/vnd.google-apps.document',
          'application/vnd.google-apps.spreadsheet'
        ]}
        onImportComplete={(file, content) => {
          console.log('Imported:', file.name, content);
        }}
      />
    </>
  );
}
```

### DriveDragDropImporter

Add drag-and-drop support for Google Drive URLs.

```typescript
import { DriveDragDropImporter, DriveDragDropZone } from '@/components/drive/DriveDragDropImporter';

// Wrapper component
function MyEditor({ editor }) {
  return (
    <DriveDragDropImporter
      editor={editor}
      autoImport={true}
      importFormat="html"
      onFileImport={(file, content) => {
        console.log('Imported:', file.name);
      }}
    >
      <div className="editor-container">
        {/* Your editor content */}
      </div>
    </DriveDragDropImporter>
  );
}

// Or standalone drop zone
function DropZone() {
  return (
    <DriveDragDropZone
      onFileImport={(file, content) => {
        console.log('Dropped:', file.name);
      }}
      importFormat="markdown"
    />
  );
}
```

## Custom Hooks

### useDriveFiles

Fetch and manage Google Drive files with caching and pagination.

```typescript
import { useDriveFiles } from '@/hooks/useDriveFiles';

function FileList() {
  const {
    files,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useDriveFiles({
    folderId: 'specific-folder-id', // Optional
    searchQuery: 'my documents',    // Optional
    mimeType: 'application/vnd.google-apps.document',
    pageSize: 50,
    orderBy: 'modifiedTime desc',
    enabled: true
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>{file.name}</div>
      ))}
      
      {hasNextPage && (
        <button onClick={fetchNextPage}>
          Load More
        </button>
      )}
    </div>
  );
}
```

### useDriveUpload

Handle file uploads with progress tracking and batch operations.

```typescript
import { useDriveUpload, useDriveFileInput } from '@/hooks/useDriveUpload';

function UploadComponent() {
  const upload = useDriveUpload({
    maxConcurrent: 3,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/jpeg', 'image/png'],
    autoUpload: true,
    onComplete: (file) => console.log('Uploaded:', file),
    onError: (error, fileName) => console.error('Failed:', fileName)
  });

  // Or use file input hook
  const fileInput = useDriveFileInput({
    multiple: true,
    accept: 'image/*'
  });

  return (
    <div>
      <button onClick={fileInput.openFileDialog}>
        Select Files
      </button>
      
      <div {...upload.dropHandlers}>
        Drop files here
      </div>

      {/* Progress display */}
      {upload.uploadProgress.map(progress => (
        <div key={progress.fileId}>
          {progress.fileName}: {progress.progress}%
        </div>
      ))}

      <fileInput.FileInput />
    </div>
  );
}
```

### useDriveOperations

Perform file operations like copy, move, delete, share.

```typescript
import { useDriveOperations } from '@/hooks/useDriveOperations';

function FileActions({ fileId }) {
  const operations = useDriveOperations();

  const handleOperations = async () => {
    // Create folder
    const folder = await operations.createFolder('New Folder');
    
    // Copy file
    const copy = await operations.copyFile(fileId, 'Copy of File');
    
    // Move file
    await operations.moveFile(fileId, folder.id);
    
    // Share file
    await operations.shareFile({
      fileId,
      type: 'user',
      role: 'reader',
      emailAddress: 'user@example.com'
    });
    
    // Star/unstar
    await operations.toggleStar(fileId, true);
    
    // Download content
    const content = await operations.downloadFile(fileId);
    
    // Convert document
    const html = await operations.convertToHtml(fileId);
    const markdown = await operations.convertToMarkdown(fileId);
  };

  return (
    <div>
      <button onClick={handleOperations}>
        Perform Operations
      </button>
      
      {operations.isLoading && <div>Processing...</div>}
    </div>
  );
}
```

### useFileSearch

Search Google Drive files with advanced filtering.

```typescript
import { useFileSearch } from '@/hooks/useDriveFiles';

function SearchComponent() {
  const { searchFiles, searchResults, isSearching, clearSearch } = useFileSearch();

  const handleSearch = async (query) => {
    await searchFiles(query, {
      mimeType: 'application/vnd.google-apps.document',
      folderId: 'specific-folder',
      includeShared: true,
      pageSize: 20
    });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search files..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      {isSearching && <div>Searching...</div>}
      
      <div>
        {searchResults.map(file => (
          <div key={file.id}>{file.name}</div>
        ))}
      </div>
      
      <button onClick={clearSearch}>Clear</button>
    </div>
  );
}
```

## Utilities

### File Type Detection

```typescript
import {
  detectFileTypeCategory,
  getFileTypeInfo,
  isGoogleWorkspaceFile,
  isConvertible,
  isPreviewable,
  getExportFormats
} from '@/utils/driveFileUtils';

const file = { mimeType: 'application/vnd.google-apps.document' };

// Detect category
const category = detectFileTypeCategory(file.mimeType); // 'document'

// Get type info
const typeInfo = getFileTypeInfo(file.mimeType);
// { category: 'document', label: 'Document', icon: '📄', color: '#4285f4', ... }

// Check capabilities
const isWorkspace = isGoogleWorkspaceFile(file.mimeType); // true
const canConvert = isConvertible(file.mimeType); // true
const canPreview = isPreviewable(file.mimeType); // true

// Get export options
const formats = getExportFormats(file.mimeType);
// [{ mimeType: 'application/pdf', extension: 'pdf', label: 'PDF' }, ...]
```

### File Formatting

```typescript
import {
  formatFileSize,
  formatFileDate,
  getFileExtension,
  getFileThumbnailUrl
} from '@/utils/driveFileUtils';

// Format file size
const size = formatFileSize(1024 * 1024); // "1.0 MB"

// Format date
const date = formatFileDate(file.modifiedTime); // "2 hours ago"
const absoluteDate = formatFileDate(file.modifiedTime, false); // "01/15/2024 2:30 PM"

// Get extension
const ext = getFileExtension(file.name, file.mimeType); // "pdf"

// Get thumbnail
const thumbnailUrl = getFileThumbnailUrl(file, 400); // High-res thumbnail
```

### Content Processing

```typescript
import {
  extractTextFromDocument,
  convertDocumentToHtml,
  convertDocumentToMarkdown,
  downloadAndConvertFile
} from '@/utils/driveFileUtils';

// Extract text content
const text = await extractTextFromDocument(documentId);

// Convert to formats
const html = await convertDocumentToHtml(documentId);
const markdown = await convertDocumentToMarkdown(documentId);

// Download and convert
const blob = await downloadAndConvertFile(
  fileId,
  'application/pdf',
  'document.pdf'
);
```

### File Filtering and Sorting

```typescript
import { filterFiles, sortFiles } from '@/utils/driveFileUtils';

// Filter files
const filtered = filterFiles(files, {
  mimeTypes: ['application/vnd.google-apps.document'],
  categories: ['document', 'image'],
  sizeLimitBytes: 10 * 1024 * 1024, // 10MB
  dateRange: { start: new Date('2024-01-01'), end: new Date() },
  searchText: 'report',
  starred: true,
  shared: false
});

// Sort files
const sorted = sortFiles(files, 'modified', 'desc');
// Options: 'name', 'modified', 'created', 'size', 'type'
```

## Advanced Features

### Caching

The integration includes intelligent caching to improve performance:

```typescript
import { driveCache, cacheUtils } from '@/lib/driveCache';

// Manual cache operations
driveCache.setFile(file);
const cachedFile = driveCache.getFile(fileId);

// Cache with fallback
const file = await cacheUtils.getOrFetch(
  { type: 'file', id: fileId },
  () => googleDriveService.getFile(fileId)
);

// Invalidate cache
driveCache.invalidateFile(fileId);
driveCache.invalidateFolder(folderId);

// Get cache statistics
const stats = driveCache.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

### Batch Operations

```typescript
import { batchProcessFiles } from '@/utils/driveFileUtils';

// Process files in batches
const results = await batchProcessFiles(
  files,
  async (file) => {
    return await operations.downloadFile(file.id);
  },
  (completed, total, current) => {
    console.log(`Progress: ${completed}/${total} - ${current.name}`);
  }
);
```

### Error Handling

```typescript
import { GoogleDriveApiError } from '@/lib/google-api-error-handler';

try {
  const file = await googleDriveService.getFile(fileId);
} catch (error) {
  if (error instanceof GoogleDriveApiError) {
    console.error('API Error:', error.message, error.status);
    
    // Handle specific error types
    if (error.status === 404) {
      console.log('File not found');
    } else if (error.status === 403) {
      console.log('Permission denied');
    }
  }
}
```

## Best Practices

### 1. Authentication

Always check authentication status before making API calls:

```typescript
const { isAuthenticated, accessToken } = useGoogleAuth();

if (!isAuthenticated) {
  return <div>Please sign in to access Google Drive</div>;
}
```

### 2. Error Boundaries

Wrap Drive components in error boundaries:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function DriveSection() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong with Google Drive</div>}
      onError={(error) => console.error('Drive error:', error)}
    >
      <GoogleDriveFileBrowser />
    </ErrorBoundary>
  );
}
```

### 3. Performance

- Use pagination for large file lists
- Implement virtual scrolling for very large datasets
- Cache frequently accessed files
- Preload related data when possible

```typescript
// Good: Paginated loading
const { files, hasNextPage, fetchNextPage } = useDriveFiles({
  pageSize: 50
});

// Good: Preload file details
useEffect(() => {
  if (files.length > 0) {
    const fileIds = files.map(f => f.id);
    driveCache.preloadFiles(fileIds, googleDriveService.getFile);
  }
}, [files]);
```

### 4. User Experience

- Show loading states for all operations
- Provide progress feedback for uploads
- Handle offline scenarios gracefully
- Use optimistic updates where appropriate

```typescript
function FileUpload() {
  const upload = useDriveUpload({
    onProgress: (progress) => {
      // Show progress to user
      setUploadProgress(progress.progress);
    },
    onComplete: (file) => {
      // Show success message
      toast.success(`Uploaded ${file.name}`);
    },
    onError: (error) => {
      // Show error message
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  return (
    <div>
      {upload.isUploading && (
        <div>
          Uploading... {upload.totalProgress}%
        </div>
      )}
    </div>
  );
}
```

### 5. Type Safety

Always use TypeScript interfaces for better development experience:

```typescript
import { GoogleDriveFile, GoogleMimeType } from '@/types/google-api';

interface FileManagerProps {
  files: GoogleDriveFile[];
  allowedTypes: GoogleMimeType[];
  onFileSelect: (file: GoogleDriveFile) => void;
}

function FileManager({ files, allowedTypes, onFileSelect }: FileManagerProps) {
  // Type-safe component implementation
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem**: "Not authenticated" errors
**Solution**: 
- Check Google API credentials
- Verify OAuth redirect URLs
- Ensure user has granted necessary permissions

```typescript
// Debug authentication
const { isAuthenticated, error } = useGoogleAuth();
console.log('Auth status:', isAuthenticated, error);
```

#### 2. API Rate Limits

**Problem**: 429 "Rate limit exceeded" errors
**Solution**:
- Implement exponential backoff
- Use caching to reduce API calls
- Batch operations where possible

```typescript
// Configure rate limiting
const driveService = new GoogleDriveService({
  rateLimitDelay: 1000, // 1 second between requests
  maxRetries: 3
});
```

#### 3. File Access Permissions

**Problem**: 403 "Forbidden" errors
**Solution**:
- Check file sharing permissions
- Verify user has access to the file
- Handle permission errors gracefully

```typescript
try {
  const file = await googleDriveService.getFile(fileId);
} catch (error) {
  if (error.status === 403) {
    // Handle permission denied
    showErrorMessage('You don\'t have permission to access this file');
  }
}
```

#### 4. Large File Handling

**Problem**: Timeouts or memory issues with large files
**Solution**:
- Use streaming for large downloads
- Implement chunked uploads
- Show progress indicators

```typescript
// Configure timeouts
const upload = useDriveUpload({
  timeout: 300000, // 5 minutes for large files
  chunkSize: 1024 * 1024 // 1MB chunks
});
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Set in development environment
if (process.env.NODE_ENV === 'development') {
  window.driveDebug = true;
}
```

### Performance Monitoring

Monitor performance with cache statistics:

```typescript
// Log cache performance periodically
setInterval(() => {
  const stats = driveCache.getStats();
  console.log('Cache stats:', {
    hitRate: (stats.hitRate * 100).toFixed(1) + '%',
    totalEntries: stats.totalEntries,
    totalSize: (stats.totalSize / 1024).toFixed(1) + 'KB'
  });
}, 60000); // Every minute
```

## Migration Guide

### From v1 to v2

If you're upgrading from an older version:

1. **Update imports**:
   ```typescript
   // Old
   import { DriveFileBrowser } from '@/components/DriveFileBrowser';
   
   // New
   import { GoogleDriveFileBrowser } from '@/components/drive/GoogleDriveFileBrowser';
   ```

2. **Update prop names**:
   ```typescript
   // Old
   <DriveFileBrowser onSelect={handler} />
   
   // New
   <GoogleDriveFileBrowser onFileSelect={handler} />
   ```

3. **Update hook usage**:
   ```typescript
   // Old
   const { files } = useDriveFiles(folderId);
   
   // New
   const { files } = useDriveFiles({ folderId });
   ```

## Support and Resources

- **GitHub Repository**: [Link to repo]
- **API Documentation**: [Link to API docs]
- **Examples**: See `src/examples/GoogleDriveIntegrationExamples.tsx`
- **Discord Community**: [Link to Discord]

For bug reports or feature requests, please open an issue on GitHub.

---

This integration provides a robust foundation for Google Drive functionality in React applications. The components and hooks are designed to be flexible, performant, and easy to use while maintaining type safety and accessibility standards.