/**
 * Google Drive File Utilities
 * 
 * Comprehensive utilities for file type detection, conversion,
 * content processing, and metadata extraction from Google Drive files.
 */

import { GoogleDriveFile, GoogleMimeType, GoogleDocsDocument } from '@/types/google-api';
import { googleDriveService } from '@/lib/GoogleDriveService';

/**
 * File type categories and their properties
 */
export const FILE_TYPE_CATEGORIES = {
  document: {
    label: 'Document',
    mimeTypes: [
      'application/vnd.google-apps.document',
      'application/pdf',
      'text/plain',
      'text/html',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf'
    ] as GoogleMimeType[],
    icon: '📄',
    color: '#4285f4',
    convertible: true,
    previewable: true
  },
  spreadsheet: {
    label: 'Spreadsheet',
    mimeTypes: [
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ] as GoogleMimeType[],
    icon: '📊',
    color: '#34a853',
    convertible: true,
    previewable: true
  },
  presentation: {
    label: 'Presentation',
    mimeTypes: [
      'application/vnd.google-apps.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ] as GoogleMimeType[],
    icon: '📈',
    color: '#fbbc04',
    convertible: true,
    previewable: true
  },
  image: {
    label: 'Image',
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'image/webp',
      'image/tiff'
    ] as GoogleMimeType[],
    icon: '🖼️',
    color: '#ea4335',
    convertible: false,
    previewable: true
  },
  video: {
    label: 'Video',
    mimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/avi',
      'video/mkv',
      'video/webm',
      'video/ogg'
    ] as GoogleMimeType[],
    icon: '🎬',
    color: '#ff6d01',
    convertible: false,
    previewable: true
  },
  audio: {
    label: 'Audio',
    mimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac'
    ] as GoogleMimeType[],
    icon: '🎵',
    color: '#9c27b0',
    convertible: false,
    previewable: true
  },
  archive: {
    label: 'Archive',
    mimeTypes: [
      'application/zip',
      'application/x-tar',
      'application/gzip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ] as GoogleMimeType[],
    icon: '📦',
    color: '#795548',
    convertible: false,
    previewable: false
  },
  code: {
    label: 'Code',
    mimeTypes: [
      'text/javascript',
      'text/css',
      'text/html',
      'application/json',
      'text/xml',
      'application/xml'
    ] as GoogleMimeType[],
    icon: '💻',
    color: '#607d8b',
    convertible: false,
    previewable: true
  },
  folder: {
    label: 'Folder',
    mimeTypes: ['application/vnd.google-apps.folder'] as GoogleMimeType[],
    icon: '📁',
    color: '#4285f4',
    convertible: false,
    previewable: false
  }
};

/**
 * Export format options for different file types
 */
export const EXPORT_FORMATS = {
  'application/vnd.google-apps.document': [
    { mimeType: 'application/pdf', extension: 'pdf', label: 'PDF' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx', label: 'Microsoft Word' },
    { mimeType: 'application/vnd.oasis.opendocument.text', extension: 'odt', label: 'OpenDocument Text' },
    { mimeType: 'text/html', extension: 'html', label: 'HTML' },
    { mimeType: 'text/plain', extension: 'txt', label: 'Plain Text' },
    { mimeType: 'application/epub+zip', extension: 'epub', label: 'EPUB' }
  ],
  'application/vnd.google-apps.spreadsheet': [
    { mimeType: 'application/pdf', extension: 'pdf', label: 'PDF' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx', label: 'Microsoft Excel' },
    { mimeType: 'application/vnd.oasis.opendocument.spreadsheet', extension: 'ods', label: 'OpenDocument Spreadsheet' },
    { mimeType: 'text/csv', extension: 'csv', label: 'CSV' },
    { mimeType: 'text/tab-separated-values', extension: 'tsv', label: 'TSV' }
  ],
  'application/vnd.google-apps.presentation': [
    { mimeType: 'application/pdf', extension: 'pdf', label: 'PDF' },
    { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: 'pptx', label: 'Microsoft PowerPoint' },
    { mimeType: 'application/vnd.oasis.opendocument.presentation', extension: 'odp', label: 'OpenDocument Presentation' },
    { mimeType: 'text/plain', extension: 'txt', label: 'Plain Text' },
    { mimeType: 'image/jpeg', extension: 'jpg', label: 'JPEG (slides as images)' },
    { mimeType: 'image/png', extension: 'png', label: 'PNG (slides as images)' }
  ]
} as const;

/**
 * Utility functions
 */

/**
 * Detect file type category from MIME type
 */
export function detectFileTypeCategory(mimeType: string): keyof typeof FILE_TYPE_CATEGORIES | null {
  for (const [category, config] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (config.mimeTypes.includes(mimeType as GoogleMimeType)) {
      return category as keyof typeof FILE_TYPE_CATEGORIES;
    }
  }
  return null;
}

/**
 * Get file type category information
 */
export function getFileTypeInfo(mimeType: string) {
  const category = detectFileTypeCategory(mimeType);
  if (!category) {
    return {
      category: 'unknown',
      label: 'Unknown',
      icon: '❓',
      color: '#9e9e9e',
      convertible: false,
      previewable: false
    };
  }
  
  return {
    category,
    ...FILE_TYPE_CATEGORIES[category]
  };
}

/**
 * Check if file is a Google Workspace file
 */
export function isGoogleWorkspaceFile(mimeType: string): boolean {
  return mimeType.startsWith('application/vnd.google-apps.');
}

/**
 * Check if file can be converted to other formats
 */
export function isConvertible(mimeType: string): boolean {
  return getFileTypeInfo(mimeType).convertible;
}

/**
 * Check if file can be previewed
 */
export function isPreviewable(mimeType: string): boolean {
  return getFileTypeInfo(mimeType).previewable;
}

/**
 * Get available export formats for a file
 */
export function getExportFormats(mimeType: string) {
  return EXPORT_FORMATS[mimeType as keyof typeof EXPORT_FORMATS] || [];
}

/**
 * Get file extension from name or MIME type
 */
export function getFileExtension(fileName: string, mimeType?: string): string {
  // Try to get from filename first
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < fileName.length - 1) {
    return fileName.substring(dotIndex + 1).toLowerCase();
  }

  // Fallback to MIME type mapping
  if (mimeType) {
    const extensionMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/json': 'json',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'application/zip': 'zip',
      'application/vnd.google-apps.document': 'gdoc',
      'application/vnd.google-apps.spreadsheet': 'gsheet',
      'application/vnd.google-apps.presentation': 'gslides'
    };

    return extensionMap[mimeType] || 'unknown';
  }

  return 'unknown';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | string): string {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  
  if (isNaN(size) || size === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(size) / Math.log(k));
  
  return `${(size / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format date in relative or absolute format
 */
export function formatFileDate(dateString: string, relative: boolean = true): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (relative && diffHours < 24) {
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 2) {
      return '1 hour ago';
    } else {
      return `${Math.floor(diffHours)} hours ago`;
    }
  } else if (relative && diffDays < 7) {
    if (diffDays < 1) {
      return 'Today';
    } else if (diffDays < 2) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffDays)} days ago`;
    }
  }

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate file thumbnail URL
 */
export function getFileThumbnailUrl(file: GoogleDriveFile, size: number = 200): string | null {
  if (file.thumbnailLink) {
    // Replace the size parameter in the thumbnail URL
    return file.thumbnailLink.replace(/=s\d+/, `=s${size}`);
  }
  return null;
}

/**
 * Get file preview URL
 */
export function getFilePreviewUrl(file: GoogleDriveFile): string | null {
  if (file.webViewLink) {
    return file.webViewLink;
  }
  return null;
}

/**
 * Check if file can be edited online
 */
export function isOnlineEditable(mimeType: string): boolean {
  const editableMimeTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.drawing'
  ];
  
  return editableMimeTypes.includes(mimeType);
}

/**
 * Content processing utilities
 */

/**
 * Extract text content from Google Docs
 */
export async function extractTextFromDocument(documentId: string): Promise<string> {
  try {
    const document = await googleDriveService.getDocumentContent(documentId);
    return extractTextFromGoogleDocsDocument(document);
  } catch (error) {
    console.error('Failed to extract text from document:', error);
    return '';
  }
}

/**
 * Extract text from Google Docs document structure
 */
export function extractTextFromGoogleDocsDocument(document: GoogleDocsDocument): string {
  let text = '';
  
  if (document.body?.content) {
    for (const element of document.body.content) {
      if (element.paragraph?.elements) {
        for (const paragraphElement of element.paragraph.elements) {
          if (paragraphElement.textRun?.content) {
            text += paragraphElement.textRun.content;
          }
        }
      }
    }
  }
  
  return text.trim();
}

/**
 * Convert Google Docs to HTML with styling
 */
export async function convertDocumentToHtml(documentId: string): Promise<string> {
  try {
    return await googleDriveService.convertDocumentToHtml(documentId);
  } catch (error) {
    console.error('Failed to convert document to HTML:', error);
    return '';
  }
}

/**
 * Convert Google Docs to Markdown
 */
export async function convertDocumentToMarkdown(documentId: string): Promise<string> {
  try {
    return await googleDriveService.convertDocumentToMarkdown(documentId);
  } catch (error) {
    console.error('Failed to convert document to Markdown:', error);
    return '';
  }
}

/**
 * Download and convert file to specified format
 */
export async function downloadAndConvertFile(
  fileId: string,
  targetMimeType: GoogleMimeType,
  fileName?: string
): Promise<Blob> {
  try {
    const content = await googleDriveService.exportFile({
      fileId,
      mimeType: targetMimeType
    });

    // Create blob with appropriate MIME type
    return new Blob([content], { type: targetMimeType });
  } catch (error) {
    console.error('Failed to download and convert file:', error);
    throw error;
  }
}

/**
 * Create download link for file
 */
export function createDownloadLink(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Batch process files with progress tracking
 */
export async function batchProcessFiles<T>(
  files: GoogleDriveFile[],
  processor: (file: GoogleDriveFile) => Promise<T>,
  onProgress?: (completed: number, total: number, current: GoogleDriveFile) => void
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await processor(file);
      results.push(result);
      onProgress?.(i + 1, files.length, file);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // Continue with other files
    }
  }
  
  return results;
}

/**
 * Filter files by multiple criteria
 */
export function filterFiles(
  files: GoogleDriveFile[],
  criteria: {
    mimeTypes?: GoogleMimeType[];
    categories?: (keyof typeof FILE_TYPE_CATEGORIES)[];
    sizeLimitBytes?: number;
    dateRange?: { start: Date; end: Date };
    searchText?: string;
    starred?: boolean;
    shared?: boolean;
  }
): GoogleDriveFile[] {
  return files.filter(file => {
    // MIME type filter
    if (criteria.mimeTypes && !criteria.mimeTypes.includes(file.mimeType as GoogleMimeType)) {
      return false;
    }

    // Category filter
    if (criteria.categories) {
      const category = detectFileTypeCategory(file.mimeType);
      if (!category || !criteria.categories.includes(category)) {
        return false;
      }
    }

    // Size filter
    if (criteria.sizeLimitBytes && file.size) {
      const fileSize = parseInt(file.size);
      if (fileSize > criteria.sizeLimitBytes) {
        return false;
      }
    }

    // Date range filter
    if (criteria.dateRange) {
      const fileDate = new Date(file.modifiedTime);
      if (fileDate < criteria.dateRange.start || fileDate > criteria.dateRange.end) {
        return false;
      }
    }

    // Search text filter
    if (criteria.searchText) {
      const searchLower = criteria.searchText.toLowerCase();
      if (!file.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Starred filter
    if (criteria.starred !== undefined && file.starred !== criteria.starred) {
      return false;
    }

    // Shared filter
    if (criteria.shared !== undefined && file.shared !== criteria.shared) {
      return false;
    }

    return true;
  });
}

/**
 * Sort files by various criteria
 */
export function sortFiles(
  files: GoogleDriveFile[],
  sortBy: 'name' | 'modified' | 'created' | 'size' | 'type',
  order: 'asc' | 'desc' = 'asc'
): GoogleDriveFile[] {
  const sorted = [...files].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'modified':
        comparison = new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime();
        break;
      case 'created':
        comparison = new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime();
        break;
      case 'size':
        const sizeA = a.size ? parseInt(a.size) : 0;
        const sizeB = b.size ? parseInt(b.size) : 0;
        comparison = sizeA - sizeB;
        break;
      case 'type':
        const typeA = getFileTypeInfo(a.mimeType).label;
        const typeB = getFileTypeInfo(b.mimeType).label;
        comparison = typeA.localeCompare(typeB);
        break;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  // Always sort folders first
  return sorted.sort((a, b) => {
    const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
    const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
    
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return 0;
  });
}

/**
 * Generate unique filename to avoid conflicts
 */
export function generateUniqueFileName(
  baseName: string,
  existingNames: string[]
): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const extension = getFileExtension(baseName);
  const nameWithoutExt = extension !== 'unknown' 
    ? baseName.substring(0, baseName.lastIndexOf('.'))
    : baseName;

  let counter = 1;
  let uniqueName: string;

  do {
    uniqueName = extension !== 'unknown'
      ? `${nameWithoutExt} (${counter}).${extension}`
      : `${nameWithoutExt} (${counter})`;
    counter++;
  } while (existingNames.includes(uniqueName));

  return uniqueName;
}