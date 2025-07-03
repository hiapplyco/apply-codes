/**
 * Google Docs Service for Export Operations
 * 
 * Comprehensive service class specifically for Google Docs API operations
 * including document creation, content updates, and formatting preservation.
 * Extends the existing GoogleDriveService with Docs-specific functionality.
 */

import { google, docs_v1, drive_v3 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { 
  createGoogleDocsClient, 
  createGoogleDriveClient,
  GOOGLE_API_SCOPES 
} from '@/lib/google-api-config';
import { GoogleDriveApiError } from '@/lib/google-api-error-handler';

// Google Docs API types
export interface GoogleDocsRequest {
  insertText?: {
    location: { index: number };
    text: string;
  };
  insertParagraph?: {
    location: { index: number };
    text: string;
  };
  updateTextStyle?: {
    range: { startIndex: number; endIndex: number };
    textStyle: GoogleDocsTextStyle;
    fields: string;
  };
  updateParagraphStyle?: {
    range: { startIndex: number; endIndex: number };
    paragraphStyle: GoogleDocsParagraphStyle;
    fields: string;
  };
  insertInlineImage?: {
    location: { index: number };
    uri: string;
    objectSize?: {
      height: { magnitude: number; unit: string };
      width: { magnitude: number; unit: string };
    };
  };
  createNamedRange?: {
    name: string;
    range: { startIndex: number; endIndex: number };
  };
  insertTable?: {
    location: { index: number };
    rows: number;
    columns: number;
  };
}

export interface GoogleDocsTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: { magnitude: number; unit: string };
  foregroundColor?: { color: { rgbColor: { red: number; green: number; blue: number } } };
  backgroundColor?: { color: { rgbColor: { red: number; green: number; blue: number } } };
  weightedFontFamily?: { fontFamily: string; weight: number };
  link?: { url: string };
}

export interface GoogleDocsParagraphStyle {
  namedStyleType?: 'NORMAL_TEXT' | 'TITLE' | 'SUBTITLE' | 'HEADING_1' | 'HEADING_2' | 'HEADING_3' | 'HEADING_4' | 'HEADING_5' | 'HEADING_6';
  alignment?: 'START' | 'CENTER' | 'END' | 'JUSTIFIED';
  lineSpacing?: number;
  direction?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';
  spacingMode?: 'NEVER_COLLAPSE' | 'COLLAPSE_LISTS';
  spaceAbove?: { magnitude: number; unit: string };
  spaceBelow?: { magnitude: number; unit: string };
  borderBetween?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    padding: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderTop?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    padding: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderBottom?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    padding: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderLeft?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    padding: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderRight?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    padding: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  indentFirstLine?: { magnitude: number; unit: string };
  indentStart?: { magnitude: number; unit: string };
  indentEnd?: { magnitude: number; unit: string };
  keepLinesTogether?: boolean;
  keepWithNext?: boolean;
  avoidWidowAndOrphan?: boolean;
  shading?: {
    backgroundColor: { color: { rgbColor: { red: number; green: number; blue: number } } };
  };
}

export interface GoogleDocsDocument {
  documentId: string;
  title: string;
  body: {
    content: GoogleDocsStructuralElement[];
  };
  headers?: { [key: string]: GoogleDocsHeader };
  footers?: { [key: string]: GoogleDocsFooter };
  footnotes?: { [key: string]: GoogleDocsFootnote };
  documentStyle?: GoogleDocsDocumentStyle;
  namedStyles?: {
    styles: GoogleDocsNamedStyle[];
  };
  revisionId?: string;
  suggestionsViewMode?: 'SUGGESTIONS_INLINE' | 'PREVIEW_SUGGESTIONS_ACCEPTED' | 'PREVIEW_WITHOUT_SUGGESTIONS';
  documentLanguage?: string;
}

export interface GoogleDocsStructuralElement {
  startIndex: number;
  endIndex: number;
  paragraph?: GoogleDocsParagraph;
  sectionBreak?: GoogleDocsSectionBreak;
  table?: GoogleDocsTable;
  tableOfContents?: GoogleDocsTableOfContents;
}

export interface GoogleDocsParagraph {
  elements: GoogleDocsParagraphElement[];
  paragraphStyle?: GoogleDocsParagraphStyle;
  bullet?: GoogleDocsBullet;
  positionedObjectIds?: string[];
}

export interface GoogleDocsParagraphElement {
  startIndex: number;
  endIndex: number;
  textRun?: GoogleDocsTextRun;
  autoText?: GoogleDocsAutoText;
  pageBreak?: GoogleDocsPageBreak;
  columnBreak?: GoogleDocsColumnBreak;
  footnoteReference?: GoogleDocsFootnoteReference;
  horizontalRule?: GoogleDocsHorizontalRule;
  equation?: GoogleDocsEquation;
  inlineObjectElement?: GoogleDocsInlineObjectElement;
}

export interface GoogleDocsTextRun {
  content: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsAutoText {
  type: 'PAGE_NUMBER' | 'PAGE_COUNT';
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsPageBreak {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsColumnBreak {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsFootnoteReference {
  footnoteId: string;
  footnoteNumber: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsHorizontalRule {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsEquation {
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsInlineObjectElement {
  inlineObjectId: string;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsBullet {
  listId: string;
  nestingLevel?: number;
  textStyle?: GoogleDocsTextStyle;
}

export interface GoogleDocsSectionBreak {
  sectionStyle?: GoogleDocsSectionStyle;
}

export interface GoogleDocsSectionStyle {
  columnSeparatorStyle?: 'NONE' | 'BETWEEN_EACH_COLUMN';
  contentDirection?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';
  sectionType?: 'CONTINUOUS' | 'NEXT_PAGE' | 'EVEN_PAGE' | 'ODD_PAGE';
  marginTop?: { magnitude: number; unit: string };
  marginBottom?: { magnitude: number; unit: string };
  marginLeft?: { magnitude: number; unit: string };
  marginRight?: { magnitude: number; unit: string };
  marginHeader?: { magnitude: number; unit: string };
  marginFooter?: { magnitude: number; unit: string };
  pageNumberStart?: number;
  firstPageHeaderId?: string;
  firstPageFooterId?: string;
  defaultHeaderId?: string;
  defaultFooterId?: string;
  evenPageHeaderId?: string;
  evenPageFooterId?: string;
  useFirstPageHeaderFooter?: boolean;
  columnProperties?: GoogleDocsColumnProperties[];
}

export interface GoogleDocsColumnProperties {
  width?: { magnitude: number; unit: string };
  paddingEnd?: { magnitude: number; unit: string };
}

export interface GoogleDocsTable {
  rows: number;
  columns: number;
  tableRows: GoogleDocsTableRow[];
  tableStyle?: GoogleDocsTableStyle;
  columnProperties?: GoogleDocsTableColumnProperties[];
}

export interface GoogleDocsTableRow {
  startIndex: number;
  endIndex: number;
  tableCells: GoogleDocsTableCell[];
  tableRowStyle?: GoogleDocsTableRowStyle;
}

export interface GoogleDocsTableCell {
  startIndex: number;
  endIndex: number;
  content: GoogleDocsStructuralElement[];
  tableCellStyle?: GoogleDocsTableCellStyle;
}

export interface GoogleDocsTableStyle {
  tableColumnProperties?: GoogleDocsTableColumnProperties[];
}

export interface GoogleDocsTableColumnProperties {
  width?: { magnitude: number; unit: string };
  widthType?: 'EVENLY_DISTRIBUTED' | 'FIXED_WIDTH';
}

export interface GoogleDocsTableRowStyle {
  minRowHeight?: { magnitude: number; unit: string };
  preventOverflow?: boolean;
  tableHeader?: boolean;
}

export interface GoogleDocsTableCellStyle {
  rowSpan?: number;
  columnSpan?: number;
  backgroundColor?: { color: { rgbColor: { red: number; green: number; blue: number } } };
  borderTop?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderBottom?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderLeft?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  borderRight?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
    width: { magnitude: number; unit: string };
    dashStyle: 'SOLID' | 'DOT' | 'DASH';
  };
  paddingTop?: { magnitude: number; unit: string };
  paddingBottom?: { magnitude: number; unit: string };
  paddingLeft?: { magnitude: number; unit: string };
  paddingRight?: { magnitude: number; unit: string };
  contentAlignment?: 'CONTENT_ALIGNMENT_UNSPECIFIED' | 'CONTENT_ALIGNMENT_TOP' | 'CONTENT_ALIGNMENT_MIDDLE' | 'CONTENT_ALIGNMENT_BOTTOM';
}

export interface GoogleDocsTableOfContents {
  content: GoogleDocsStructuralElement[];
}

export interface GoogleDocsHeader {
  headerId: string;
  content: GoogleDocsStructuralElement[];
}

export interface GoogleDocsFooter {
  footerId: string;
  content: GoogleDocsStructuralElement[];
}

export interface GoogleDocsFootnote {
  footnoteId: string;
  content: GoogleDocsStructuralElement[];
}

export interface GoogleDocsDocumentStyle {
  background?: {
    color: { color: { rgbColor: { red: number; green: number; blue: number } } };
  };
  pageNumberStart?: number;
  marginTop?: { magnitude: number; unit: string };
  marginBottom?: { magnitude: number; unit: string };
  marginLeft?: { magnitude: number; unit: string };
  marginRight?: { magnitude: number; unit: string };
  marginHeader?: { magnitude: number; unit: string };
  marginFooter?: { magnitude: number; unit: string };
  pageSize?: {
    height: { magnitude: number; unit: string };
    width: { magnitude: number; unit: string };
  };
  flipPageOrientation?: boolean;
  defaultHeaderId?: string;
  defaultFooterId?: string;
  evenPageHeaderId?: string;
  evenPageFooterId?: string;
  firstPageHeaderId?: string;
  firstPageFooterId?: string;
  useFirstPageHeaderFooter?: boolean;
  useEvenPageHeaderFooter?: boolean;
}

export interface GoogleDocsNamedStyle {
  namedStyleType: 'NORMAL_TEXT' | 'TITLE' | 'SUBTITLE' | 'HEADING_1' | 'HEADING_2' | 'HEADING_3' | 'HEADING_4' | 'HEADING_5' | 'HEADING_6';
  textStyle?: GoogleDocsTextStyle;
  paragraphStyle?: GoogleDocsParagraphStyle;
}

// Export interfaces
export interface GoogleDocsExportOptions {
  title?: string;
  folderId?: string;
  shareWithEmail?: string;
  shareRole?: 'reader' | 'writer' | 'commenter';
  template?: GoogleDocsTemplate;
  includeComments?: boolean;
  preserveFormatting?: boolean;
  enableCollaboration?: boolean;
  documentStyle?: Partial<GoogleDocsDocumentStyle>;
}

export interface GoogleDocsTemplate {
  id: string;
  name: string;
  description?: string;
  documentStyle?: GoogleDocsDocumentStyle;
  namedStyles?: GoogleDocsNamedStyle[];
  placeholders?: { [key: string]: string };
}

export interface GoogleDocsExportResult {
  documentId: string;
  title: string;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  exportedAt: string;
  collaborationEnabled: boolean;
  template?: GoogleDocsTemplate;
}

export interface GoogleDocsExportProgress {
  stage: 'initializing' | 'converting' | 'creating' | 'formatting' | 'sharing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
}

export interface GoogleDocsBatchExportOptions {
  documents: Array<{
    content: string;
    title: string;
    options?: GoogleDocsExportOptions;
  }>;
  folderName?: string;
  parentFolderId?: string;
  shareWithEmail?: string;
  shareRole?: 'reader' | 'writer' | 'commenter';
  template?: GoogleDocsTemplate;
  onProgress?: (progress: GoogleDocsBatchExportProgress) => void;
}

export interface GoogleDocsBatchExportProgress {
  totalDocuments: number;
  completedDocuments: number;
  currentDocument: string;
  overallProgress: number; // 0-100
  currentDocumentProgress: GoogleDocsExportProgress;
  results: GoogleDocsExportResult[];
  errors: Array<{ document: string; error: string }>;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export interface GoogleDocsBatchExportResult {
  totalDocuments: number;
  successfulExports: number;
  failedExports: number;
  results: GoogleDocsExportResult[];
  errors: Array<{ document: string; error: string }>;
  folderId?: string;
  folderWebViewLink?: string;
  exportedAt: string;
  timeElapsed: number;
}

/**
 * Main Google Docs Service class for export operations
 */
export class GoogleDocsService {
  private accessToken: string | null = null;
  private docsClient: docs_v1.Docs | null = null;
  private driveClient: drive_v3.Drive | null = null;
  private templates: Map<string, GoogleDocsTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize the service with user's access token
   */
  async initialize(accessToken: string): Promise<void> {
    try {
      this.accessToken = accessToken;
      this.docsClient = await createGoogleDocsClient(accessToken);
      this.driveClient = await createGoogleDriveClient(accessToken);
    } catch (error) {
      throw new GoogleDriveApiError('Failed to initialize Google Docs service', error);
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.accessToken !== null && this.docsClient !== null && this.driveClient !== null;
  }

  /**
   * Create a new Google Docs document
   */
  async createDocument(title: string, options: GoogleDocsExportOptions = {}): Promise<GoogleDocsExportResult> {
    this.ensureInitialized();

    try {
      const startTime = Date.now();
      
      // Create document
      const createResponse = await this.docsClient.documents.create({
        resource: {
          title: title || 'Untitled Document'
        }
      });

      const document = createResponse.data;
      
      // Apply document style if provided
      if (options.documentStyle) {
        await this.updateDocumentStyle(document.documentId, options.documentStyle);
      }

      // Apply template if provided
      if (options.template) {
        await this.applyTemplate(document.documentId, options.template);
      }

      // Move to folder if specified
      if (options.folderId) {
        await this.moveDocumentToFolder(document.documentId, options.folderId);
      }

      // Share document if specified
      if (options.shareWithEmail && options.shareRole) {
        await this.shareDocument(document.documentId, options.shareWithEmail, options.shareRole);
      }

      // Get file metadata from Drive API
      const fileResponse = await this.driveClient.files.get({
        fileId: document.documentId,
        fields: 'id, name, webViewLink, webContentLink, createdTime, modifiedTime, size'
      });

      const fileData = fileResponse.data;

      return {
        documentId: document.documentId,
        title: document.title,
        webViewLink: fileData.webViewLink,
        webContentLink: fileData.webContentLink,
        createdTime: fileData.createdTime,
        modifiedTime: fileData.modifiedTime,
        size: fileData.size,
        exportedAt: new Date().toISOString(),
        collaborationEnabled: options.enableCollaboration || false,
        template: options.template
      };

    } catch (error) {
      throw new GoogleDriveApiError('Failed to create Google Docs document', error);
    }
  }

  /**
   * Update document content with formatted text
   */
  async updateDocumentContent(documentId: string, requests: GoogleDocsRequest[]): Promise<void> {
    this.ensureInitialized();

    try {
      if (requests.length === 0) return;

      await this.docsClient.documents.batchUpdate({
        documentId,
        resource: {
          requests
        }
      });
    } catch (error) {
      throw new GoogleDriveApiError('Failed to update document content', error);
    }
  }

  /**
   * Get document content
   */
  async getDocument(documentId: string): Promise<GoogleDocsDocument> {
    this.ensureInitialized();

    try {
      const response = await this.docsClient.documents.get({
        documentId
      });

      return response.data;
    } catch (error) {
      throw new GoogleDriveApiError('Failed to get document', error);
    }
  }

  /**
   * Update document style
   */
  async updateDocumentStyle(documentId: string, style: Partial<GoogleDocsDocumentStyle>): Promise<void> {
    this.ensureInitialized();

    try {
      const requests = [{
        updateDocumentStyle: {
          documentStyle: style,
          fields: Object.keys(style).join(',')
        }
      }];

      await this.docsClient.documents.batchUpdate({
        documentId,
        resource: { requests }
      });
    } catch (error) {
      throw new GoogleDriveApiError('Failed to update document style', error);
    }
  }

  /**
   * Apply template to document
   */
  async applyTemplate(documentId: string, template: GoogleDocsTemplate): Promise<void> {
    this.ensureInitialized();

    try {
      const requests: docs_v1.Schema$Request[] = [];

      // Apply document style
      if (template.documentStyle) {
        requests.push({
          updateDocumentStyle: {
            documentStyle: template.documentStyle,
            fields: Object.keys(template.documentStyle).join(',')
          }
        });
      }

      // Apply named styles
      if (template.namedStyles && template.namedStyles.length > 0) {
        template.namedStyles.forEach(style => {
          requests.push({
            updateDocumentStyle: {
              documentStyle: {
                namedStyles: {
                  styles: [style]
                }
              },
              fields: 'namedStyles.styles'
            }
          });
        });
      }

      if (requests.length > 0) {
        await this.docsClient.documents.batchUpdate({
          documentId,
          resource: { requests }
        });
      }
    } catch (error) {
      throw new GoogleDriveApiError('Failed to apply template', error);
    }
  }

  /**
   * Move document to folder
   */
  async moveDocumentToFolder(documentId: string, folderId: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Get current parents
      const fileResponse = await this.driveClient.files.get({
        fileId: documentId,
        fields: 'parents'
      });

      const previousParents = fileResponse.data.parents ? fileResponse.data.parents.join(',') : '';

      // Move to new folder
      await this.driveClient.files.update({
        fileId: documentId,
        addParents: folderId,
        removeParents: previousParents
      });
    } catch (error) {
      throw new GoogleDriveApiError('Failed to move document to folder', error);
    }
  }

  /**
   * Share document with user
   */
  async shareDocument(documentId: string, emailAddress: string, role: 'reader' | 'writer' | 'commenter'): Promise<void> {
    this.ensureInitialized();

    try {
      await this.driveClient.permissions.create({
        fileId: documentId,
        resource: {
          role,
          type: 'user',
          emailAddress
        },
        sendNotificationEmail: true
      });
    } catch (error) {
      throw new GoogleDriveApiError('Failed to share document', error);
    }
  }

  /**
   * Export HTML content to Google Docs
   */
  async exportHtmlToGoogleDocs(
    htmlContent: string, 
    title: string, 
    options: GoogleDocsExportOptions = {},
    onProgress?: (progress: GoogleDocsExportProgress) => void
  ): Promise<GoogleDocsExportResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    
    try {
      // Stage 1: Initializing
      onProgress?.({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing export process...',
        timeElapsed: 0
      });

      // Stage 2: Converting content
      onProgress?.({
        stage: 'converting',
        progress: 20,
        message: 'Converting HTML to Google Docs format...',
        timeElapsed: Date.now() - startTime
      });

      // Convert HTML to Google Docs requests
      const requests = await this.convertHtmlToDocsRequests(htmlContent);

      // Stage 3: Creating document
      onProgress?.({
        stage: 'creating',
        progress: 40,
        message: 'Creating Google Docs document...',
        timeElapsed: Date.now() - startTime
      });

      // Create the document
      const result = await this.createDocument(title, options);

      // Stage 4: Formatting content
      onProgress?.({
        stage: 'formatting',
        progress: 60,
        message: 'Applying formatting and content...',
        timeElapsed: Date.now() - startTime
      });

      // Add content to document
      if (requests.length > 0) {
        await this.updateDocumentContent(result.documentId, requests);
      }

      // Stage 5: Sharing (if needed)
      if (options.shareWithEmail && options.shareRole) {
        onProgress?.({
          stage: 'sharing',
          progress: 80,
          message: 'Setting up sharing permissions...',
          timeElapsed: Date.now() - startTime
        });
      }

      // Stage 6: Completed
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'Export completed successfully!',
        timeElapsed: Date.now() - startTime
      });

      return result;

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - startTime
      });
      throw new GoogleDriveApiError('Failed to export HTML to Google Docs', error);
    }
  }

  /**
   * Batch export multiple documents
   */
  async batchExportToGoogleDocs(
    options: GoogleDocsBatchExportOptions
  ): Promise<GoogleDocsBatchExportResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const results: GoogleDocsExportResult[] = [];
    const errors: Array<{ document: string; error: string }> = [];
    let folderId: string | undefined;
    let folderWebViewLink: string | undefined;

    try {
      // Create folder if needed
      if (options.folderName) {
        const folderResponse = await this.driveClient.files.create({
          resource: {
            name: options.folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: options.parentFolderId ? [options.parentFolderId] : undefined
          }
        });
        folderId = folderResponse.data.id;
        folderWebViewLink = folderResponse.data.webViewLink;
      }

      // Export each document
      for (let i = 0; i < options.documents.length; i++) {
        const doc = options.documents[i];
        const overallProgress = Math.floor((i / options.documents.length) * 100);

        options.onProgress?.({
          totalDocuments: options.documents.length,
          completedDocuments: i,
          currentDocument: doc.title,
          overallProgress,
          currentDocumentProgress: {
            stage: 'initializing',
            progress: 0,
            message: `Exporting ${doc.title}...`,
            timeElapsed: Date.now() - startTime
          },
          results,
          errors,
          timeElapsed: Date.now() - startTime,
          estimatedTimeRemaining: this.estimateRemainingTime(startTime, i, options.documents.length)
        });

        try {
          const exportOptions: GoogleDocsExportOptions = {
            ...doc.options,
            folderId: folderId || options.parentFolderId,
            shareWithEmail: options.shareWithEmail,
            shareRole: options.shareRole,
            template: options.template
          };

          const result = await this.exportHtmlToGoogleDocs(
            doc.content,
            doc.title,
            exportOptions,
            (progress) => {
              options.onProgress?.({
                totalDocuments: options.documents.length,
                completedDocuments: i,
                currentDocument: doc.title,
                overallProgress: Math.floor((i / options.documents.length) * 100),
                currentDocumentProgress: progress,
                results,
                errors,
                timeElapsed: Date.now() - startTime,
                estimatedTimeRemaining: this.estimateRemainingTime(startTime, i, options.documents.length)
              });
            }
          );

          results.push(result);
        } catch (error) {
          errors.push({
            document: doc.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const finalResult: GoogleDocsBatchExportResult = {
        totalDocuments: options.documents.length,
        successfulExports: results.length,
        failedExports: errors.length,
        results,
        errors,
        folderId,
        folderWebViewLink,
        exportedAt: new Date().toISOString(),
        timeElapsed: Date.now() - startTime
      };

      // Final progress update
      options.onProgress?.({
        totalDocuments: options.documents.length,
        completedDocuments: options.documents.length,
        currentDocument: '',
        overallProgress: 100,
        currentDocumentProgress: {
          stage: 'completed',
          progress: 100,
          message: 'Batch export completed',
          timeElapsed: Date.now() - startTime
        },
        results,
        errors,
        timeElapsed: Date.now() - startTime,
        estimatedTimeRemaining: 0
      });

      return finalResult;

    } catch (error) {
      throw new GoogleDriveApiError('Failed to perform batch export', error);
    }
  }

  /**
   * Get available templates
   */
  getTemplates(): GoogleDocsTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): GoogleDocsTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Add custom template
   */
  addTemplate(template: GoogleDocsTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Remove template
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Convert HTML to Google Docs requests
   */
  private async convertHtmlToDocsRequests(htmlContent: string): Promise<GoogleDocsRequest[]> {
    // Import the converter dynamically to avoid circular dependencies
    const { GoogleDocsConverter } = await import('./googleDocsConverter');
    return GoogleDocsConverter.convertHtmlToGoogleDocs(htmlContent);
  }

  /**
   * Estimate remaining time for batch operations
   */
  private estimateRemainingTime(startTime: number, completed: number, total: number): number {
    if (completed === 0) return 0;
    
    const timeElapsed = Date.now() - startTime;
    const avgTimePerDocument = timeElapsed / completed;
    const remaining = total - completed;
    
    return Math.floor(avgTimePerDocument * remaining);
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Basic template
    this.templates.set('basic', {
      id: 'basic',
      name: 'Basic Document',
      description: 'Clean, simple document formatting',
      documentStyle: {
        marginTop: { magnitude: 72, unit: 'PT' },
        marginBottom: { magnitude: 72, unit: 'PT' },
        marginLeft: { magnitude: 72, unit: 'PT' },
        marginRight: { magnitude: 72, unit: 'PT' }
      },
      namedStyles: [
        {
          namedStyleType: 'NORMAL_TEXT',
          textStyle: {
            fontSize: { magnitude: 11, unit: 'PT' },
            weightedFontFamily: { fontFamily: 'Arial', weight: 400 }
          }
        },
        {
          namedStyleType: 'HEADING_1',
          textStyle: {
            fontSize: { magnitude: 20, unit: 'PT' },
            bold: true,
            weightedFontFamily: { fontFamily: 'Arial', weight: 700 }
          }
        },
        {
          namedStyleType: 'HEADING_2',
          textStyle: {
            fontSize: { magnitude: 16, unit: 'PT' },
            bold: true,
            weightedFontFamily: { fontFamily: 'Arial', weight: 700 }
          }
        }
      ]
    });

    // Professional template
    this.templates.set('professional', {
      id: 'professional',
      name: 'Professional Document',
      description: 'Formal document with professional styling',
      documentStyle: {
        marginTop: { magnitude: 72, unit: 'PT' },
        marginBottom: { magnitude: 72, unit: 'PT' },
        marginLeft: { magnitude: 90, unit: 'PT' },
        marginRight: { magnitude: 90, unit: 'PT' }
      },
      namedStyles: [
        {
          namedStyleType: 'NORMAL_TEXT',
          textStyle: {
            fontSize: { magnitude: 12, unit: 'PT' },
            weightedFontFamily: { fontFamily: 'Times New Roman', weight: 400 }
          },
          paragraphStyle: {
            lineSpacing: 1.5,
            spaceAfter: { magnitude: 6, unit: 'PT' }
          }
        },
        {
          namedStyleType: 'HEADING_1',
          textStyle: {
            fontSize: { magnitude: 18, unit: 'PT' },
            bold: true,
            weightedFontFamily: { fontFamily: 'Times New Roman', weight: 700 }
          },
          paragraphStyle: {
            spaceAfter: { magnitude: 12, unit: 'PT' },
            alignment: 'CENTER'
          }
        }
      ]
    });

    // Modern template
    this.templates.set('modern', {
      id: 'modern',
      name: 'Modern Document',
      description: 'Contemporary styling with clean typography',
      documentStyle: {
        marginTop: { magnitude: 72, unit: 'PT' },
        marginBottom: { magnitude: 72, unit: 'PT' },
        marginLeft: { magnitude: 72, unit: 'PT' },
        marginRight: { magnitude: 72, unit: 'PT' }
      },
      namedStyles: [
        {
          namedStyleType: 'NORMAL_TEXT',
          textStyle: {
            fontSize: { magnitude: 11, unit: 'PT' },
            weightedFontFamily: { fontFamily: 'Calibri', weight: 400 }
          }
        },
        {
          namedStyleType: 'HEADING_1',
          textStyle: {
            fontSize: { magnitude: 24, unit: 'PT' },
            bold: true,
            weightedFontFamily: { fontFamily: 'Calibri', weight: 700 },
            foregroundColor: { 
              color: { 
                rgbColor: { red: 0.2, green: 0.4, blue: 0.8 } 
              } 
            }
          }
        }
      ]
    });
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new GoogleDriveApiError('Google Docs service not initialized');
    }
  }
}

// Export singleton instance
export const googleDocsService = new GoogleDocsService();