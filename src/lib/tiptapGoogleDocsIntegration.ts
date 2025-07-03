/**
 * Tiptap to Google Docs Integration
 * 
 * Seamless integration between Tiptap editor and Google Docs export
 * with advanced formatting preservation and content optimization
 */

import { Editor } from '@tiptap/react';
import { 
  GoogleDocsService, 
  GoogleDocsExportOptions, 
  GoogleDocsExportResult,
  GoogleDocsExportProgress
} from './GoogleDocsService';
import { GoogleDocsConverter, TiptapConverter, ContentTemplateConverter } from './googleDocsConverter';
import { 
  GoogleDocsFormatter, 
  ContentTypeFormatter, 
  TemplateFormatter,
  FormattingOptions 
} from './googleDocsFormatting';

/**
 * Export options specific to Tiptap content
 */
export interface TiptapExportOptions extends GoogleDocsExportOptions {
  contentType?: 'job_description' | 'analysis_report' | 'general_content';
  optimizeFormatting?: boolean;
  preserveTiptapStructure?: boolean;
  enhanceReadability?: boolean;
  customFormatting?: FormattingOptions;
}

/**
 * Export result with Tiptap-specific information
 */
export interface TiptapExportResult extends GoogleDocsExportResult {
  originalFormat: 'html' | 'json';
  contentType: string;
  formattingApplied: string[];
  wordCount: number;
  characterCount: number;
}

/**
 * Main integration class for Tiptap to Google Docs export
 */
export class TiptapGoogleDocsIntegration {
  private googleDocsService: GoogleDocsService;
  private isInitialized = false;

  constructor() {
    this.googleDocsService = new GoogleDocsService();
  }

  /**
   * Initialize with Google access token
   */
  async initialize(accessToken: string): Promise<void> {
    await this.googleDocsService.initialize(accessToken);
    this.isInitialized = true;
  }

  /**
   * Check if integration is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.googleDocsService.isInitialized();
  }

  /**
   * Export Tiptap editor content to Google Docs
   */
  async exportEditorContent(
    editor: Editor,
    title: string,
    options: TiptapExportOptions = {},
    onProgress?: (progress: GoogleDocsExportProgress) => void
  ): Promise<TiptapExportResult> {
    if (!this.isReady()) {
      throw new Error('Integration not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Get content from Tiptap editor
      const htmlContent = editor.getHTML();
      const jsonContent = editor.getJSON();

      // Calculate content metrics
      const textContent = editor.getText();
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = textContent.length;

      onProgress?.({
        stage: 'initializing',
        progress: 10,
        message: 'Preparing content for export...',
        timeElapsed: Date.now() - startTime
      });

      // Choose the best conversion method
      let convertedContent: string;
      let originalFormat: 'html' | 'json';

      if (options.preserveTiptapStructure) {
        // Use JSON conversion for better structure preservation
        const requests = await TiptapConverter.convertTiptapJson(jsonContent);
        convertedContent = await this.requestsToHtml(requests);
        originalFormat = 'json';
      } else {
        // Use HTML conversion for simpler processing
        convertedContent = htmlContent;
        originalFormat = 'html';
      }

      onProgress?.({
        stage: 'converting',
        progress: 30,
        message: 'Converting content format...',
        timeElapsed: Date.now() - startTime
      });

      // Apply content-specific formatting
      if (options.contentType && options.optimizeFormatting) {
        convertedContent = await this.optimizeContentForType(
          convertedContent, 
          options.contentType
        );
      }

      // Prepare export options
      const exportOptions: GoogleDocsExportOptions = {
        ...options,
        title,
        template: this.selectTemplate(options),
        preserveFormatting: options.preserveTiptapStructure !== false
      };

      onProgress?.({
        stage: 'creating',
        progress: 50,
        message: 'Creating Google Docs document...',
        timeElapsed: Date.now() - startTime
      });

      // Export to Google Docs
      const result = await this.googleDocsService.exportHtmlToGoogleDocs(
        convertedContent,
        title,
        exportOptions,
        onProgress
      );

      // Create enhanced result
      const enhancedResult: TiptapExportResult = {
        ...result,
        originalFormat,
        contentType: options.contentType || 'general_content',
        formattingApplied: this.getAppliedFormatting(options),
        wordCount,
        characterCount
      };

      return enhancedResult;

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Export HTML content directly
   */
  async exportHtmlContent(
    htmlContent: string,
    title: string,
    options: TiptapExportOptions = {},
    onProgress?: (progress: GoogleDocsExportProgress) => void
  ): Promise<TiptapExportResult> {
    if (!this.isReady()) {
      throw new Error('Integration not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Calculate content metrics
      const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = textContent.length;

      onProgress?.({
        stage: 'initializing',
        progress: 10,
        message: 'Processing HTML content...',
        timeElapsed: Date.now() - startTime
      });

      // Apply content-specific optimization
      let processedContent = htmlContent;
      if (options.contentType && options.optimizeFormatting) {
        processedContent = await this.optimizeContentForType(
          processedContent, 
          options.contentType
        );
      }

      // Prepare export options
      const exportOptions: GoogleDocsExportOptions = {
        ...options,
        title,
        template: this.selectTemplate(options),
        preserveFormatting: true
      };

      onProgress?.({
        stage: 'converting',
        progress: 30,
        message: 'Converting to Google Docs format...',
        timeElapsed: Date.now() - startTime
      });

      // Export to Google Docs
      const result = await this.googleDocsService.exportHtmlToGoogleDocs(
        processedContent,
        title,
        exportOptions,
        onProgress
      );

      // Create enhanced result
      const enhancedResult: TiptapExportResult = {
        ...result,
        originalFormat: 'html',
        contentType: options.contentType || 'general_content',
        formattingApplied: this.getAppliedFormatting(options),
        wordCount,
        characterCount
      };

      return enhancedResult;

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Batch export multiple editor instances
   */
  async batchExportEditors(
    editors: Array<{
      editor: Editor;
      title: string;
      options?: TiptapExportOptions;
    }>,
    batchOptions: {
      folderName?: string;
      parentFolderId?: string;
      shareWithEmail?: string;
      shareRole?: 'reader' | 'writer' | 'commenter';
      onProgress?: (progress: any) => void;
    } = {}
  ): Promise<{
    results: TiptapExportResult[];
    errors: Array<{ title: string; error: string }>;
  }> {
    if (!this.isReady()) {
      throw new Error('Integration not initialized');
    }

    const results: TiptapExportResult[] = [];
    const errors: Array<{ title: string; error: string }> = [];

    for (let i = 0; i < editors.length; i++) {
      const { editor, title, options = {} } = editors[i];
      
      batchOptions.onProgress?.({
        totalDocuments: editors.length,
        currentDocument: i + 1,
        currentTitle: title,
        progress: Math.floor((i / editors.length) * 100)
      });

      try {
        const result = await this.exportEditorContent(
          editor,
          title,
          {
            ...options,
            folderId: batchOptions.parentFolderId,
            shareWithEmail: batchOptions.shareWithEmail,
            shareRole: batchOptions.shareRole
          }
        );
        results.push(result);
      } catch (error) {
        errors.push({
          title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { results, errors };
  }

  /**
   * Get available templates for specific content types
   */
  getAvailableTemplates(contentType?: string): Array<{
    id: string;
    name: string;
    description: string;
    contentType?: string;
  }> {
    const templates = this.googleDocsService.getTemplates();
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      contentType: this.getTemplateContentType(template.id)
    }));
  }

  /**
   * Preview export formatting without actually creating document
   */
  async previewExportFormatting(
    editor: Editor,
    options: TiptapExportOptions = {}
  ): Promise<{
    htmlPreview: string;
    formattingApplied: string[];
    wordCount: number;
    characterCount: number;
    estimatedSize: string;
  }> {
    const htmlContent = editor.getHTML();
    const textContent = editor.getText();
    
    // Apply content-specific optimization
    let processedContent = htmlContent;
    if (options.contentType && options.optimizeFormatting) {
      processedContent = await this.optimizeContentForType(
        processedContent, 
        options.contentType
      );
    }

    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = textContent.length;
    const estimatedSize = this.estimateDocumentSize(characterCount);

    return {
      htmlPreview: processedContent,
      formattingApplied: this.getAppliedFormatting(options),
      wordCount,
      characterCount,
      estimatedSize
    };
  }

  /**
   * Optimize content for specific content type
   */
  private async optimizeContentForType(
    content: string,
    contentType: 'job_description' | 'analysis_report' | 'general_content'
  ): Promise<string> {
    switch (contentType) {
      case 'job_description':
        // Apply job description specific optimizations
        return this.optimizeJobDescriptionContent(content);
      case 'analysis_report':
        // Apply analysis report specific optimizations
        return this.optimizeAnalysisReportContent(content);
      default:
        // Apply general content optimizations
        return this.optimizeGeneralContent(content);
    }
  }

  /**
   * Optimize job description content
   */
  private async optimizeJobDescriptionContent(content: string): Promise<string> {
    // Add job description specific optimizations
    let optimized = content;
    
    // Ensure consistent header structure
    optimized = optimized.replace(
      /<h1[^>]*>(.*?)<\/h1>/gi,
      '<h1 style="text-align: center; margin-bottom: 20px;">$1</h1>'
    );
    
    // Enhance section headers
    optimized = optimized.replace(
      /<h2[^>]*>(.*?)<\/h2>/gi,
      '<h2 style="margin-top: 24px; margin-bottom: 12px; color: #333;">$1</h2>'
    );
    
    // Format bullet points consistently
    optimized = optimized.replace(
      /<ul[^>]*>/gi,
      '<ul style="margin: 12px 0; padding-left: 20px;">'
    );
    
    return optimized;
  }

  /**
   * Optimize analysis report content
   */
  private async optimizeAnalysisReportContent(content: string): Promise<string> {
    // Add analysis report specific optimizations
    let optimized = content;
    
    // Enhance table formatting
    optimized = optimized.replace(
      /<table[^>]*>/gi,
      '<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">'
    );
    
    // Format headers consistently
    optimized = optimized.replace(
      /<h1[^>]*>(.*?)<\/h1>/gi,
      '<h1 style="text-align: center; margin-bottom: 24px; color: #1a365d;">$1</h1>'
    );
    
    return optimized;
  }

  /**
   * Optimize general content
   */
  private async optimizeGeneralContent(content: string): Promise<string> {
    // Add general content optimizations
    let optimized = content;
    
    // Ensure consistent paragraph spacing
    optimized = optimized.replace(
      /<p[^>]*>/gi,
      '<p style="margin: 8px 0; line-height: 1.5;">'
    );
    
    // Enhance link formatting
    optimized = optimized.replace(
      /<a([^>]*href="[^"]*"[^>]*)>/gi,
      '<a$1 style="color: #2563eb; text-decoration: underline;">'
    );
    
    return optimized;
  }

  /**
   * Select appropriate template based on options
   */
  private selectTemplate(options: TiptapExportOptions): any {
    if (options.template) {
      return options.template;
    }
    
    switch (options.contentType) {
      case 'job_description':
        return TemplateFormatter.createJobDescriptionTemplate();
      case 'analysis_report':
        return TemplateFormatter.createProfessionalTemplate();
      default:
        return TemplateFormatter.createModernTemplate();
    }
  }

  /**
   * Get list of applied formatting
   */
  private getAppliedFormatting(options: TiptapExportOptions): string[] {
    const formatting: string[] = [];
    
    if (options.preserveTiptapStructure) {
      formatting.push('Structure Preservation');
    }
    
    if (options.optimizeFormatting) {
      formatting.push('Content Optimization');
    }
    
    if (options.enhanceReadability) {
      formatting.push('Readability Enhancement');
    }
    
    if (options.contentType) {
      formatting.push(`Content Type: ${options.contentType}`);
    }
    
    if (options.template) {
      formatting.push(`Template: ${options.template.name || 'Custom'}`);
    }
    
    return formatting;
  }

  /**
   * Get content type for template
   */
  private getTemplateContentType(templateId: string): string | undefined {
    const contentTypeMap: { [key: string]: string } = {
      'job-description': 'job_description',
      'professional': 'analysis_report',
      'modern': 'general_content'
    };
    
    return contentTypeMap[templateId];
  }

  /**
   * Estimate document size
   */
  private estimateDocumentSize(characterCount: number): string {
    const bytes = characterCount * 2; // Rough estimate
    
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    } else {
      return `${Math.round(bytes / (1024 * 1024))} MB`;
    }
  }

  /**
   * Convert requests to HTML (utility method)
   */
  private async requestsToHtml(requests: any[]): Promise<string> {
    // This is a simplified conversion - in practice, you'd need to
    // reconstruct HTML from the Google Docs requests
    return requests
      .filter(req => req.insertText)
      .map(req => req.insertText.text)
      .join('');
  }
}

/**
 * Export singleton instance
 */
export const tiptapGoogleDocsIntegration = new TiptapGoogleDocsIntegration();

/**
 * Utility hook for React components
 */
export interface UseTiptapGoogleDocsExport {
  exportContent: (
    editor: Editor,
    title: string,
    options?: TiptapExportOptions
  ) => Promise<TiptapExportResult>;
  exportHtml: (
    html: string,
    title: string,
    options?: TiptapExportOptions
  ) => Promise<TiptapExportResult>;
  isReady: boolean;
  isExporting: boolean;
  progress: GoogleDocsExportProgress | null;
  error: string | null;
}

/**
 * Hook for Tiptap Google Docs export (if used in React components)
 */
export function useTiptapGoogleDocsExport(accessToken?: string): UseTiptapGoogleDocsExport {
  // This would be implemented as a React hook in a real application
  // For now, return a basic implementation
  return {
    exportContent: async (editor, title, options) => {
      if (accessToken) {
        await tiptapGoogleDocsIntegration.initialize(accessToken);
      }
      return tiptapGoogleDocsIntegration.exportEditorContent(editor, title, options);
    },
    exportHtml: async (html, title, options) => {
      if (accessToken) {
        await tiptapGoogleDocsIntegration.initialize(accessToken);
      }
      return tiptapGoogleDocsIntegration.exportHtmlContent(html, title, options);
    },
    isReady: tiptapGoogleDocsIntegration.isReady(),
    isExporting: false,
    progress: null,
    error: null
  };
}