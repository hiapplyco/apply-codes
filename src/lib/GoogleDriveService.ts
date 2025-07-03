/**
 * Google Drive Service
 * 
 * Comprehensive service class for Google Drive API operations including
 * file management, folder operations, sharing, and content access.
 */

import { 
  GoogleDriveFile, 
  GoogleDriveFileList, 
  GoogleDriveSearchParams,
  GoogleDriveCreateParams,
  GoogleMimeType,
  GoogleDriveOrderBy,
  GoogleApiError,
  GoogleDocsDocument,
  GoogleApiResponse
} from '@/types/google-api';
import { 
  createGoogleDriveClient, 
  createGoogleDocsClient,
  extractGoogleFileId,
  GOOGLE_API_SCOPES 
} from '@/lib/google-api-config';
import { GoogleDriveApiError } from '@/lib/google-api-error-handler';

/**
 * Interface for file upload operations
 */
export interface GoogleDriveUploadParams {
  name: string;
  content: string | ArrayBuffer | Blob;
  mimeType: GoogleMimeType;
  parents?: string[];
  description?: string;
  starred?: boolean;
  folderId?: string;
}

/**
 * Interface for file sharing operations
 */
export interface GoogleDriveShareParams {
  fileId: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  allowFileDiscovery?: boolean;
  sendNotificationEmail?: boolean;
}

/**
 * Interface for file export operations
 */
export interface GoogleDriveExportParams {
  fileId: string;
  mimeType: GoogleMimeType;
  format?: 'pdf' | 'docx' | 'odt' | 'html' | 'epub' | 'txt';
}

/**
 * Interface for batch operations
 */
export interface GoogleDriveBatchOperation {
  operation: 'copy' | 'move' | 'delete' | 'share' | 'star' | 'unstar';
  fileIds: string[];
  destinationFolderId?: string;
  shareParams?: Omit<GoogleDriveShareParams, 'fileId'>;
}

/**
 * Cache interface for Drive file metadata
 */
export interface GoogleDriveCache {
  files: Map<string, GoogleDriveFile>;
  folders: Map<string, GoogleDriveFile[]>;
  lastUpdated: Map<string, number>;
  maxAge: number;
}

/**
 * Main Google Drive Service class
 */
export class GoogleDriveService {
  private accessToken: string | null = null;
  private driveClient: any = null;
  private docsClient: any = null;
  private cache: GoogleDriveCache;

  constructor() {
    this.cache = {
      files: new Map(),
      folders: new Map(),
      lastUpdated: new Map(),
      maxAge: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Initialize the service with user's access token
   */
  async initialize(accessToken: string): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.driveClient = await createGoogleDriveClient(accessToken);
      this.docsClient = await createGoogleDocsClient(accessToken);
    } catch (error) {
      throw new GoogleDriveApiError('Failed to initialize Google Drive service', error);
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.accessToken !== null && this.driveClient !== null;
  }

  /**
   * Get user's Drive files with advanced filtering and search
   */
  async getFiles(params: GoogleDriveSearchParams = {}): Promise<GoogleDriveFileList> {
    this.ensureInitialized();
    
    const cacheKey = JSON.stringify(params);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cachedResult = this.cache.folders.get(cacheKey);
      if (cachedResult) {
        return {
          kind: 'drive#fileList',
          files: cachedResult,
          nextPageToken: undefined
        };
      }
    }

    try {
      const defaultParams = {
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, parents, size, createdTime, modifiedTime, trashed, starred, shared, ownedByMe, capabilities, owners, lastModifyingUser, thumbnailLink, webViewLink, webContentLink, iconLink, fileExtension, fullFileExtension)',
        orderBy: 'modifiedTime desc' as GoogleDriveOrderBy,
        query: 'trashed = false',
        ...params
      };

      // Build query string
      if (params.query) {
        defaultParams.query = `(${params.query}) and trashed = false`;
      }

      const response = await this.driveClient.files.list(defaultParams);
      const fileList: GoogleDriveFileList = response.data;

      // Cache results
      this.cache.folders.set(cacheKey, fileList.files);
      this.cache.lastUpdated.set(cacheKey, Date.now());

      return fileList;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to fetch files', error);
    }
  }

  /**
   * Search files with advanced query building
   */
  async searchFiles(query: string, options: {
    mimeType?: GoogleMimeType;
    folderId?: string;
    includeShared?: boolean;
    includeTrashed?: boolean;
    pageSize?: number;
  } = {}): Promise<GoogleDriveFileList> {
    const searchQuery = this.buildSearchQuery(query, options);
    
    return this.getFiles({
      query: searchQuery,
      pageSize: options.pageSize || 50,
      orderBy: 'relevance desc'
    });
  }

  /**
   * Get recent files (modified in last 30 days)
   */
  async getRecentFiles(limit: number = 20): Promise<GoogleDriveFile[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const query = `modifiedTime >= '${thirtyDaysAgo.toISOString()}'`;
    
    const result = await this.getFiles({
      query: query,
      pageSize: limit,
      orderBy: 'modifiedTime desc'
    });
    
    return result.files;
  }

  /**
   * Get starred files
   */
  async getStarredFiles(): Promise<GoogleDriveFile[]> {
    const result = await this.getFiles({
      query: 'starred = true',
      orderBy: 'modifiedTime desc'
    });
    
    return result.files;
  }

  /**
   * Get shared files
   */
  async getSharedFiles(): Promise<GoogleDriveFile[]> {
    const result = await this.getFiles({
      query: 'sharedWithMe = true',
      orderBy: 'sharedWithMeTime desc'
    });
    
    return result.files;
  }

  /**
   * Get file by ID with caching
   */
  async getFile(fileId: string): Promise<GoogleDriveFile> {
    this.ensureInitialized();
    
    // Check cache first
    if (this.isCacheValid(fileId)) {
      const cachedFile = this.cache.files.get(fileId);
      if (cachedFile) {
        return cachedFile;
      }
    }

    try {
      const response = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType, parents, size, createdTime, modifiedTime, trashed, starred, shared, ownedByMe, capabilities, owners, lastModifyingUser, thumbnailLink, webViewLink, webContentLink, iconLink, fileExtension, fullFileExtension, description, properties, appProperties'
      });

      const file: GoogleDriveFile = response.data;
      
      // Cache the file
      this.cache.files.set(fileId, file);
      this.cache.lastUpdated.set(fileId, Date.now());

      return file;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to fetch file', error);
    }
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folderId: string): Promise<GoogleDriveFile[]> {
    const result = await this.getFiles({
      query: `'${folderId}' in parents`,
      orderBy: 'folder,name'
    });
    
    return result.files;
  }

  /**
   * Create a new folder
   */
  async createFolder(name: string, parentFolderId?: string): Promise<GoogleDriveFile> {
    this.ensureInitialized();

    try {
      const fileMetadata: GoogleDriveCreateParams = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await this.driveClient.files.create({
        resource: fileMetadata,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime'
      });

      const folder: GoogleDriveFile = response.data;
      
      // Clear cache for parent folder
      this.clearFolderCache(parentFolderId);
      
      return folder;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to create folder', error);
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(params: GoogleDriveUploadParams): Promise<GoogleDriveFile> {
    this.ensureInitialized();

    try {
      const fileMetadata: GoogleDriveCreateParams = {
        name: params.name,
        parents: params.folderId ? [params.folderId] : params.parents,
        description: params.description,
        starred: params.starred
      };

      const media = {
        mimeType: params.mimeType,
        body: params.content
      };

      const response = await this.driveClient.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, parents, size, createdTime, modifiedTime, webViewLink, webContentLink'
      });

      const file: GoogleDriveFile = response.data;
      
      // Clear cache for parent folder
      this.clearFolderCache(params.folderId);
      
      return file;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to upload file', error);
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await this.driveClient.files.get({
        fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to download file', error);
    }
  }

  /**
   * Export Google Docs as different formats
   */
  async exportFile(params: GoogleDriveExportParams): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await this.driveClient.files.export({
        fileId: params.fileId,
        mimeType: params.mimeType
      });

      return response.data;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to export file', error);
    }
  }

  /**
   * Get Google Docs document content
   */
  async getDocumentContent(documentId: string): Promise<GoogleDocsDocument> {
    this.ensureInitialized();

    try {
      const response = await this.docsClient.documents.get({
        documentId
      });

      return response.data;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to fetch document content', error);
    }
  }

  /**
   * Convert Google Docs to HTML
   */
  async convertDocumentToHtml(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentContent(documentId);
      return this.parseDocumentToHtml(document);
    } catch (error) {
      throw new GoogleDriveApiError('Failed to convert document to HTML', error);
    }
  }

  /**
   * Convert Google Docs to Markdown
   */
  async convertDocumentToMarkdown(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentContent(documentId);
      return this.parseDocumentToMarkdown(document);
    } catch (error) {
      throw new GoogleDriveApiError('Failed to convert document to Markdown', error);
    }
  }

  /**
   * Share a file with specific permissions
   */
  async shareFile(params: GoogleDriveShareParams): Promise<void> {
    this.ensureInitialized();

    try {
      const permission = {
        type: params.type,
        role: params.role,
        emailAddress: params.emailAddress,
        domain: params.domain,
        allowFileDiscovery: params.allowFileDiscovery
      };

      await this.driveClient.permissions.create({
        fileId: params.fileId,
        resource: permission,
        sendNotificationEmail: params.sendNotificationEmail || false
      });

      // Clear cache for this file
      this.cache.files.delete(params.fileId);
    } catch (error) {
      throw new GoogleDriveApiError('Failed to share file', error);
    }
  }

  /**
   * Copy a file
   */
  async copyFile(fileId: string, newName?: string, parentFolderId?: string): Promise<GoogleDriveFile> {
    this.ensureInitialized();

    try {
      const copyMetadata: any = {};
      
      if (newName) {
        copyMetadata.name = newName;
      }
      
      if (parentFolderId) {
        copyMetadata.parents = [parentFolderId];
      }

      const response = await this.driveClient.files.copy({
        fileId,
        resource: copyMetadata,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, webViewLink'
      });

      const copiedFile: GoogleDriveFile = response.data;
      
      // Clear cache for parent folder
      this.clearFolderCache(parentFolderId);
      
      return copiedFile;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to copy file', error);
    }
  }

  /**
   * Move a file to a different folder
   */
  async moveFile(fileId: string, newParentFolderId: string): Promise<GoogleDriveFile> {
    this.ensureInitialized();

    try {
      // Get current parents
      const file = await this.getFile(fileId);
      const previousParents = file.parents?.join(',') || '';

      const response = await this.driveClient.files.update({
        fileId,
        addParents: newParentFolderId,
        removeParents: previousParents,
        fields: 'id, name, mimeType, parents, modifiedTime'
      });

      const movedFile: GoogleDriveFile = response.data;
      
      // Clear cache for both old and new parent folders
      if (file.parents) {
        file.parents.forEach(parentId => this.clearFolderCache(parentId));
      }
      this.clearFolderCache(newParentFolderId);
      
      return movedFile;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to move file', error);
    }
  }

  /**
   * Delete a file (move to trash)
   */
  async deleteFile(fileId: string): Promise<void> {
    this.ensureInitialized();

    try {
      const file = await this.getFile(fileId);
      
      await this.driveClient.files.update({
        fileId,
        resource: { trashed: true }
      });

      // Clear cache
      this.cache.files.delete(fileId);
      if (file.parents) {
        file.parents.forEach(parentId => this.clearFolderCache(parentId));
      }
    } catch (error) {
      throw new GoogleDriveApiError('Failed to delete file', error);
    }
  }

  /**
   * Permanently delete a file
   */
  async permanentlyDeleteFile(fileId: string): Promise<void> {
    this.ensureInitialized();

    try {
      const file = await this.getFile(fileId);
      
      await this.driveClient.files.delete({
        fileId
      });

      // Clear cache
      this.cache.files.delete(fileId);
      if (file.parents) {
        file.parents.forEach(parentId => this.clearFolderCache(parentId));
      }
    } catch (error) {
      throw new GoogleDriveApiError('Failed to permanently delete file', error);
    }
  }

  /**
   * Star/unstar a file
   */
  async toggleStar(fileId: string, starred: boolean): Promise<void> {
    this.ensureInitialized();

    try {
      await this.driveClient.files.update({
        fileId,
        resource: { starred }
      });

      // Update cache
      const cachedFile = this.cache.files.get(fileId);
      if (cachedFile) {
        cachedFile.starred = starred;
      }
    } catch (error) {
      throw new GoogleDriveApiError('Failed to toggle star', error);
    }
  }

  /**
   * Perform batch operations on multiple files
   */
  async batchOperation(operation: GoogleDriveBatchOperation): Promise<void> {
    this.ensureInitialized();

    try {
      const promises = operation.fileIds.map(fileId => {
        switch (operation.operation) {
          case 'copy':
            return this.copyFile(fileId, undefined, operation.destinationFolderId);
          case 'move':
            return operation.destinationFolderId ? 
              this.moveFile(fileId, operation.destinationFolderId) : 
              Promise.resolve();
          case 'delete':
            return this.deleteFile(fileId);
          case 'share':
            return operation.shareParams ? 
              this.shareFile({ ...operation.shareParams, fileId }) : 
              Promise.resolve();
          case 'star':
            return this.toggleStar(fileId, true);
          case 'unstar':
            return this.toggleStar(fileId, false);
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(promises);
      
      // Clear relevant caches
      this.clearAllCaches();
    } catch (error) {
      throw new GoogleDriveApiError('Failed to perform batch operation', error);
    }
  }

  /**
   * Get file from URL
   */
  async getFileFromUrl(url: string): Promise<GoogleDriveFile | null> {
    const fileId = extractGoogleFileId(url);
    if (!fileId) {
      return null;
    }

    try {
      return await this.getFile(fileId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.files.clear();
    this.cache.folders.clear();
    this.cache.lastUpdated.clear();
  }

  /**
   * Private helper methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new GoogleDriveApiError('Google Drive service not initialized');
    }
  }

  private isCacheValid(key: string): boolean {
    const lastUpdated = this.cache.lastUpdated.get(key);
    if (!lastUpdated) return false;
    
    return Date.now() - lastUpdated < this.cache.maxAge;
  }

  private clearFolderCache(folderId?: string): void {
    if (!folderId) return;
    
    // Clear all cached folder contents that might include this folder
    for (const [key, value] of this.cache.folders) {
      if (key.includes(folderId)) {
        this.cache.folders.delete(key);
        this.cache.lastUpdated.delete(key);
      }
    }
  }

  private buildSearchQuery(query: string, options: {
    mimeType?: GoogleMimeType;
    folderId?: string;
    includeShared?: boolean;
    includeTrashed?: boolean;
  }): string {
    const conditions: string[] = [];

    // Add text search
    if (query.trim()) {
      conditions.push(`name contains '${query}' or fullText contains '${query}'`);
    }

    // Add mime type filter
    if (options.mimeType) {
      conditions.push(`mimeType = '${options.mimeType}'`);
    }

    // Add folder filter
    if (options.folderId) {
      conditions.push(`'${options.folderId}' in parents`);
    }

    // Add shared files filter
    if (options.includeShared) {
      conditions.push('sharedWithMe = true');
    }

    // Add trashed filter
    if (!options.includeTrashed) {
      conditions.push('trashed = false');
    }

    return conditions.join(' and ');
  }

  private parseDocumentToHtml(document: GoogleDocsDocument): string {
    // This is a simplified parser - in a real implementation,
    // you'd want a more comprehensive conversion
    let html = '';
    
    if (document.body.content) {
      for (const element of document.body.content) {
        if (element.paragraph) {
          html += this.parseParagraphToHtml(element.paragraph);
        } else if (element.table) {
          html += this.parseTableToHtml(element.table);
        }
      }
    }

    return html;
  }

  private parseDocumentToMarkdown(document: GoogleDocsDocument): string {
    // This is a simplified parser - in a real implementation,
    // you'd want a more comprehensive conversion
    let markdown = '';
    
    if (document.body.content) {
      for (const element of document.body.content) {
        if (element.paragraph) {
          markdown += this.parseParagraphToMarkdown(element.paragraph);
        } else if (element.table) {
          markdown += this.parseTableToMarkdown(element.table);
        }
      }
    }

    return markdown;
  }

  private parseParagraphToHtml(paragraph: any): string {
    let html = '<p>';
    
    if (paragraph.elements) {
      for (const element of paragraph.elements) {
        if (element.textRun) {
          let text = element.textRun.content;
          
          // Apply text formatting
          if (element.textRun.textStyle) {
            if (element.textRun.textStyle.bold) {
              text = `<strong>${text}</strong>`;
            }
            if (element.textRun.textStyle.italic) {
              text = `<em>${text}</em>`;
            }
            if (element.textRun.textStyle.underline) {
              text = `<u>${text}</u>`;
            }
          }
          
          html += text;
        }
      }
    }
    
    html += '</p>';
    return html;
  }

  private parseParagraphToMarkdown(paragraph: any): string {
    let markdown = '';
    
    if (paragraph.elements) {
      for (const element of paragraph.elements) {
        if (element.textRun) {
          let text = element.textRun.content;
          
          // Apply text formatting
          if (element.textRun.textStyle) {
            if (element.textRun.textStyle.bold) {
              text = `**${text}**`;
            }
            if (element.textRun.textStyle.italic) {
              text = `*${text}*`;
            }
            if (element.textRun.textStyle.underline) {
              text = `<u>${text}</u>`;
            }
          }
          
          markdown += text;
        }
      }
    }
    
    markdown += '\n\n';
    return markdown;
  }

  private parseTableToHtml(table: any): string {
    let html = '<table>';
    
    if (table.tableRows) {
      for (const row of table.tableRows) {
        html += '<tr>';
        
        if (row.tableCells) {
          for (const cell of row.tableCells) {
            html += '<td>';
            
            if (cell.content) {
              for (const element of cell.content) {
                if (element.paragraph) {
                  html += this.parseParagraphToHtml(element.paragraph);
                }
              }
            }
            
            html += '</td>';
          }
        }
        
        html += '</tr>';
      }
    }
    
    html += '</table>';
    return html;
  }

  private parseTableToMarkdown(table: any): string {
    let markdown = '';
    
    if (table.tableRows) {
      for (let i = 0; i < table.tableRows.length; i++) {
        const row = table.tableRows[i];
        let rowMarkdown = '|';
        
        if (row.tableCells) {
          for (const cell of row.tableCells) {
            let cellContent = '';
            
            if (cell.content) {
              for (const element of cell.content) {
                if (element.paragraph) {
                  cellContent += this.parseParagraphToMarkdown(element.paragraph);
                }
              }
            }
            
            rowMarkdown += ` ${cellContent.trim()} |`;
          }
        }
        
        markdown += rowMarkdown + '\n';
        
        // Add header separator for first row
        if (i === 0) {
          const separatorRow = '|' + ' --- |'.repeat(row.tableCells?.length || 0);
          markdown += separatorRow + '\n';
        }
      }
    }
    
    return markdown + '\n';
  }
}

// Export a singleton instance
export const googleDriveService = new GoogleDriveService();