/**
 * Google Docs Export Utilities
 * 
 * Helper functions and examples for using the Google Docs export service
 * with Tiptap editor content
 */

import { Editor } from '@tiptap/react';
import { 
  tiptapGoogleDocsIntegration, 
  TiptapExportOptions, 
  TiptapExportResult 
} from './tiptapGoogleDocsIntegration';
import { GoogleDocsExportProgress } from './GoogleDocsService';

/**
 * Quick export functions for common use cases
 */
export class GoogleDocsExportUtils {
  /**
   * Quick export with default settings
   */
  static async quickExport(
    editor: Editor,
    title: string,
    accessToken: string
  ): Promise<TiptapExportResult> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    return tiptapGoogleDocsIntegration.exportEditorContent(
      editor,
      title,
      {
        template: { id: 'basic', name: 'Basic Document', description: 'Clean, simple document' },
        preserveFormatting: true,
        optimizeFormatting: true
      }
    );
  }

  /**
   * Export with progress tracking
   */
  static async exportWithProgress(
    editor: Editor,
    title: string,
    accessToken: string,
    onProgress: (progress: GoogleDocsExportProgress) => void
  ): Promise<TiptapExportResult> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    return tiptapGoogleDocsIntegration.exportEditorContent(
      editor,
      title,
      {
        template: { id: 'modern', name: 'Modern Document', description: 'Modern styling' },
        preserveFormatting: true,
        optimizeFormatting: true,
        enhanceReadability: true
      },
      onProgress
    );
  }

  /**
   * Export job description with optimized formatting
   */
  static async exportJobDescription(
    editor: Editor,
    title: string,
    accessToken: string,
    companyName?: string
  ): Promise<TiptapExportResult> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    const options: TiptapExportOptions = {
      contentType: 'job_description',
      optimizeFormatting: true,
      enhanceReadability: true,
      preserveTiptapStructure: true,
      title: companyName ? `${companyName} - ${title}` : title
    };
    
    return tiptapGoogleDocsIntegration.exportEditorContent(
      editor,
      title,
      options
    );
  }

  /**
   * Export analysis report with professional formatting
   */
  static async exportAnalysisReport(
    editor: Editor,
    title: string,
    accessToken: string,
    shareWithEmail?: string
  ): Promise<TiptapExportResult> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    const options: TiptapExportOptions = {
      contentType: 'analysis_report',
      optimizeFormatting: true,
      enhanceReadability: true,
      shareWithEmail,
      shareRole: 'reader' as const,
      enableCollaboration: true
    };
    
    return tiptapGoogleDocsIntegration.exportEditorContent(
      editor,
      title,
      options
    );
  }

  /**
   * Export HTML content directly
   */
  static async exportHtmlContent(
    htmlContent: string,
    title: string,
    accessToken: string,
    contentType: 'job_description' | 'analysis_report' | 'general_content' = 'general_content'
  ): Promise<TiptapExportResult> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    return tiptapGoogleDocsIntegration.exportHtmlContent(
      htmlContent,
      title,
      {
        contentType,
        optimizeFormatting: true,
        enhanceReadability: true
      }
    );
  }

  /**
   * Batch export multiple documents
   */
  static async batchExport(
    documents: Array<{
      editor: Editor;
      title: string;
      contentType?: 'job_description' | 'analysis_report' | 'general_content';
    }>,
    accessToken: string,
    folderName: string,
    onProgress?: (progress: any) => void
  ): Promise<{
    results: TiptapExportResult[];
    errors: Array<{ title: string; error: string }>;
  }> {
    await tiptapGoogleDocsIntegration.initialize(accessToken);
    
    const editorsWithOptions = documents.map(doc => ({
      editor: doc.editor,
      title: doc.title,
      options: {
        contentType: doc.contentType || 'general_content',
        optimizeFormatting: true,
        enhanceReadability: true
      }
    }));
    
    return tiptapGoogleDocsIntegration.batchExportEditors(
      editorsWithOptions,
      {
        folderName,
        onProgress
      }
    );
  }

  /**
   * Preview export without creating document
   */
  static async previewExport(
    editor: Editor,
    contentType: 'job_description' | 'analysis_report' | 'general_content' = 'general_content'
  ): Promise<{
    htmlPreview: string;
    formattingApplied: string[];
    wordCount: number;
    characterCount: number;
    estimatedSize: string;
  }> {
    return tiptapGoogleDocsIntegration.previewExportFormatting(
      editor,
      {
        contentType,
        optimizeFormatting: true,
        enhanceReadability: true
      }
    );
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    contentType?: string;
  }> {
    return tiptapGoogleDocsIntegration.getAvailableTemplates();
  }

  /**
   * Validate export requirements
   */
  static validateExportRequirements(
    editor: Editor,
    title: string,
    accessToken: string
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check access token
    if (!accessToken || accessToken.trim().length === 0) {
      errors.push('Access token is required');
    }
    
    // Check title
    if (!title || title.trim().length === 0) {
      errors.push('Document title is required');
    }
    
    // Check editor content
    if (!editor || editor.getText().trim().length === 0) {
      warnings.push('Document appears to be empty');
    }
    
    // Check content length
    const textContent = editor?.getText() || '';
    if (textContent.length > 1000000) {
      warnings.push('Document is very large and may take longer to export');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate export metrics
   */
  static calculateExportMetrics(editor: Editor): {
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    headingCount: number;
    listCount: number;
    linkCount: number;
    estimatedExportTime: number; // in seconds
  } {
    const htmlContent = editor.getHTML();
    const textContent = editor.getText();
    
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = textContent.length;
    const paragraphCount = (htmlContent.match(/<p[^>]*>/g) || []).length;
    const headingCount = (htmlContent.match(/<h[1-6][^>]*>/g) || []).length;
    const listCount = (htmlContent.match(/<[ou]l[^>]*>/g) || []).length;
    const linkCount = (htmlContent.match(/<a[^>]*href/g) || []).length;
    
    // Estimate export time based on content complexity
    const baseTime = 2; // 2 seconds base
    const wordTime = wordCount * 0.001; // 1ms per word
    const formattingTime = (headingCount + listCount + linkCount) * 0.1; // 100ms per formatting element
    const estimatedExportTime = Math.max(baseTime, wordTime + formattingTime);
    
    return {
      wordCount,
      characterCount,
      paragraphCount,
      headingCount,
      listCount,
      linkCount,
      estimatedExportTime
    };
  }
}

/**
 * Export configuration presets
 */
export const ExportPresets = {
  // Basic export with minimal formatting
  basic: {
    template: { id: 'basic', name: 'Basic Document', description: 'Clean, simple document' },
    preserveFormatting: true,
    optimizeFormatting: false,
    enhanceReadability: false
  },

  // Professional export with enhanced formatting
  professional: {
    template: { id: 'professional', name: 'Professional Document', description: 'Professional styling' },
    preserveFormatting: true,
    optimizeFormatting: true,
    enhanceReadability: true,
    customFormatting: {
      lineSpacing: 1.5,
      fontSize: 12,
      fontFamily: 'Times New Roman'
    }
  },

  // Modern export with contemporary styling
  modern: {
    template: { id: 'modern', name: 'Modern Document', description: 'Modern styling' },
    preserveFormatting: true,
    optimizeFormatting: true,
    enhanceReadability: true,
    customFormatting: {
      lineSpacing: 1.2,
      fontSize: 11,
      fontFamily: 'Calibri'
    }
  },

  // Job description optimized export
  jobDescription: {
    contentType: 'job_description' as const,
    template: { id: 'job-description', name: 'Job Description', description: 'Optimized for job descriptions' },
    preserveFormatting: true,
    optimizeFormatting: true,
    enhanceReadability: true,
    preserveTiptapStructure: true
  },

  // Analysis report optimized export
  analysisReport: {
    contentType: 'analysis_report' as const,
    template: { id: 'professional', name: 'Professional Document', description: 'Professional styling' },
    preserveFormatting: true,
    optimizeFormatting: true,
    enhanceReadability: true,
    enableCollaboration: true
  }
};

/**
 * Error handling utilities
 */
export class ExportErrorHandler {
  static handleExportError(error: any): {
    userMessage: string;
    technicalMessage: string;
    suggestedAction: string;
  } {
    if (error.message?.includes('not initialized')) {
      return {
        userMessage: 'Google Docs integration not set up',
        technicalMessage: error.message,
        suggestedAction: 'Please check your Google API credentials and try again'
      };
    }
    
    if (error.message?.includes('quota')) {
      return {
        userMessage: 'Google API quota exceeded',
        technicalMessage: error.message,
        suggestedAction: 'Please wait a moment and try again, or contact support if this persists'
      };
    }
    
    if (error.message?.includes('permission')) {
      return {
        userMessage: 'Permission denied',
        technicalMessage: error.message,
        suggestedAction: 'Please check your Google Drive permissions and try again'
      };
    }
    
    return {
      userMessage: 'Export failed',
      technicalMessage: error.message || 'Unknown error',
      suggestedAction: 'Please try again or contact support if the problem persists'
    };
  }
}

/**
 * Example usage patterns
 */
export const ExportExamples = {
  // Simple export
  simple: `
    const result = await GoogleDocsExportUtils.quickExport(
      editor,
      'My Document',
      accessToken
    );
    console.log('Document created:', result.webViewLink);
  `,

  // Export with progress
  withProgress: `
    const result = await GoogleDocsExportUtils.exportWithProgress(
      editor,
      'My Document',
      accessToken,
      (progress) => {
        console.log(\`\${progress.stage}: \${progress.progress}%\`);
      }
    );
  `,

  // Job description export
  jobDescription: `
    const result = await GoogleDocsExportUtils.exportJobDescription(
      editor,
      'Software Engineer Position',
      accessToken,
      'Tech Corp'
    );
  `,

  // Batch export
  batch: `
    const result = await GoogleDocsExportUtils.batchExport(
      [
        { editor: editor1, title: 'Document 1', contentType: 'job_description' },
        { editor: editor2, title: 'Document 2', contentType: 'analysis_report' }
      ],
      accessToken,
      'Exported Documents',
      (progress) => console.log(progress)
    );
  `
};