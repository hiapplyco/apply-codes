/**
 * Job Description Export Utility
 *
 * Exports ClarvidaJobTemplate data to multiple formats:
 * - .docx (Word document with proper formatting)
 * - .pdf (PDF with Clarvida branding)
 * - .md (Markdown)
 * - .txt (Plain text)
 */

import { ClarvidaJobTemplate } from '@/types/organization';

// Re-export helpers
export { CLARVIDA_PURPLE, CLARVIDA_DARK, BENEFIT_LABELS, generateFilename, formatSalary, getEnabledBenefits } from './helpers';

// Re-export format functions
export { generateMarkdown, exportToMarkdown } from './markdown';
export { generatePlainText, exportToText } from './plaintext';
export { exportToDocx } from './docx';
export { exportToPdf } from './pdf';

// Import for use in the class
import { exportToDocx } from './docx';
import { exportToPdf } from './pdf';
import { generateMarkdown, exportToMarkdown } from './markdown';
import { generatePlainText, exportToText } from './plaintext';

// =============================================================================
// MAIN EXPORT CLASS
// =============================================================================

export class JobDescriptionExporter {
  /**
   * Export to all formats
   */
  static async exportAll(template: Partial<ClarvidaJobTemplate>): Promise<void> {
    await Promise.all([
      exportToDocx(template),
      exportToPdf(template),
    ]);
    exportToMarkdown(template);
    exportToText(template);
  }

  /**
   * Export to specific format
   */
  static async export(
    template: Partial<ClarvidaJobTemplate>,
    format: 'docx' | 'pdf' | 'md' | 'txt'
  ): Promise<void> {
    switch (format) {
      case 'docx':
        await exportToDocx(template);
        break;
      case 'pdf':
        await exportToPdf(template);
        break;
      case 'md':
        exportToMarkdown(template);
        break;
      case 'txt':
        exportToText(template);
        break;
    }
  }

  /**
   * Get markdown preview (for display)
   */
  static getMarkdownPreview(template: Partial<ClarvidaJobTemplate>): string {
    return generateMarkdown(template);
  }

  /**
   * Get plain text preview
   */
  static getPlainTextPreview(template: Partial<ClarvidaJobTemplate>): string {
    return generatePlainText(template);
  }
}

export default JobDescriptionExporter;
