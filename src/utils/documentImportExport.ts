import mammoth from 'mammoth';

export interface ImportResult {
  success: boolean;
  content?: string;
  error?: string;
}

export class DocumentImportExport {
  /**
   * Import a Word document (.docx) and convert to HTML
   */
  static async importDocx(file: File): Promise<ImportResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Document import warnings:', result.messages);
      }
      
      return {
        success: true,
        content: result.value
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import document'
      };
    }
  }

  /**
   * Import a plain text file
   */
  static async importText(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      // Convert plain text to basic HTML with paragraphs
      const htmlContent = text
        .split('\n\n')
        .filter(paragraph => paragraph.trim())
        .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      return {
        success: true,
        content: htmlContent || '<p>Empty document</p>'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import text file'
      };
    }
  }

  /**
   * Import an HTML file
   */
  static async importHtml(file: File): Promise<ImportResult> {
    try {
      const html = await file.text();
      // Basic HTML sanitization (remove script tags, etc.)
      const sanitizedHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
      
      return {
        success: true,
        content: sanitizedHtml
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import HTML file'
      };
    }
  }

  /**
   * Export content as HTML file
   */
  static exportAsHtml(content: string, filename: string = 'document.html'): void {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename.replace('.html', '')}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }
        table td, table th {
            border: 1px solid #ddd;
            padding: 8px 12px;
        }
        table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 8px 0;
        }
        .has-text-align-center { text-align: center; }
        .has-text-align-right { text-align: right; }
        .has-text-align-justify { text-align: justify; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export content as plain text file
   */
  static exportAsText(content: string, filename: string = 'document.txt'): void {
    // Convert HTML to plain text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export content as Markdown file
   */
  static exportAsMarkdown(content: string, filename: string = 'document.md'): void {
    // Basic HTML to Markdown conversion
    const markdown = content
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      // Lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Line breaks
      .replace(/<br[^>]*>/gi, '\n')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Print the document
   */
  static printDocument(content: string, title: string = 'Document'): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the document');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @media print {
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #000;
                margin: 0;
                padding: 20px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 16px 0;
            }
            table td, table th {
                border: 1px solid #000;
                padding: 8px 12px;
            }
            table th {
                background-color: #f0f0f0;
                font-weight: 600;
            }
            img {
                max-width: 100%;
                height: auto;
            }
            .has-text-align-center { text-align: center; }
            .has-text-align-right { text-align: right; }
            .has-text-align-justify { text-align: justify; }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  /**
   * Get supported file types for import
   */
  static getSupportedImportTypes(): string[] {
    return [
      '.docx',
      '.txt',
      '.html',
      '.htm'
    ];
  }

  /**
   * Check if file type is supported for import
   */
  static isSupportedImportType(file: File): boolean {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return this.getSupportedImportTypes().includes(extension);
  }

  /**
   * Import any supported file type
   */
  static async importFile(file: File): Promise<ImportResult> {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case '.docx':
        return this.importDocx(file);
      case '.txt':
        return this.importText(file);
      case '.html':
      case '.htm':
        return this.importHtml(file);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${extension}`
        };
    }
  }
}