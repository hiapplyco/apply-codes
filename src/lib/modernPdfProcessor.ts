import { toast } from "sonner";

// Modern PDF processor with robust worker-free extraction
export class ModernPdfProcessor {
  /**
   * Extract text from PDF using PDF.js in worker-free mode
   * This approach is most reliable for browser environments
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('Starting PDF extraction (worker-free mode)...');

      // Dynamic import to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist');

      // Disable worker completely - run in main thread for maximum compatibility
      // This is slower but avoids all worker/CDN/CORS issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      const arrayBuffer = await file.arrayBuffer();

      console.log('Loading PDF document...', { size: arrayBuffer.byteLength });

      // Load document with worker disabled
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: false,
        verbosity: 0
      });

      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully:', { pages: pdf.numPages });

      let fullText = '';
      const totalPages = pdf.numPages;

      console.log(`Processing ${totalPages} pages from PDF`);

      // Extract text from all pages with enhanced formatting
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          // Enhanced text extraction with better spacing and structure
          const pageText = textContent.items
            .map((item: any) => {
              const text = item.str || '';
              const hasEOL = item.hasEOL;
              // Add newline for end-of-line items, space otherwise
              return text + (hasEOL ? '\n' : ' ');
            })
            .join('');

          fullText += pageText;

          if (i % 5 === 0 || i === totalPages) {
            console.log(`Processed ${i}/${totalPages} pages`);
          }
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${i}:`, pageError);
          fullText += `\n[Page ${i} - extraction failed]\n`;
        }
      }

      // Clean up the extracted text - preserve some structure
      const cleanedText = fullText
        .replace(/[ \t]+/g, ' ')  // Normalize spaces (but not newlines)
        .replace(/\n{3,}/g, '\n\n')  // Reduce excessive line breaks
        .trim();

      console.log('PDF extraction successful:', {
        totalPages,
        originalLength: fullText.length,
        cleanedLength: cleanedText.length,
        hasContent: cleanedText.length > 0
      });

      if (cleanedText.length === 0) {
        throw new Error('PDF contains no extractable text. It may be image-based or encrypted.');
      }

      return cleanedText;
    } catch (error) {
      console.error('PDF extraction failed:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to extract text from PDF.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF') || error.message.includes('corrupted') || error.message.includes('Invalid')) {
          errorMessage = 'PDF file appears to be corrupted or invalid.';
        } else if (error.message.includes('password') || error.message.includes('encrypted')) {
          errorMessage = 'PDF is password-protected or encrypted. Please provide an unprotected version.';
        } else if (error.message.includes('no extractable text') || error.message.includes('image-based')) {
          errorMessage = 'PDF contains no text (may be image-based). Try using OCR or convert to text-based PDF.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    }
  }
  
  /**
   * Extract text from DOCX files
   */
  static async extractTextFromDOCX(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      
      const result = await mammoth.extractRawText({
        arrayBuffer: arrayBuffer
      });
      
      if (result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages);
      }
      
      const text = result.value.trim();
      
      if (!text) {
        throw new Error('No text could be extracted from the document.');
      }
      
      return text;
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      throw new Error('Failed to process the Word document. Please ensure it\'s not corrupted.');
    }
  }
  
  /**
   * Extract text from text files
   */
  static async extractTextFromTXT(file: File): Promise<string> {
    try {
      const text = await file.text();
      
      if (!text.trim()) {
        throw new Error('The text file is empty.');
      }
      
      return text;
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to read the text file.');
    }
  }
}

// Main document processor
export class DocumentProcessor {
  static validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}. Please use PDF, DOCX, TXT, or image files.`
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 20MB.`
      };
    }
    
    return { valid: true };
  }

  /**
   * Process document with modern extraction methods
   */
  static async processDocument(options: {
    file: File;
    userId: string;
    onProgress?: (message: string) => void;
    onComplete?: (extractedText: string) => void;
    onError?: (error: string) => void;
  }): Promise<string> {
    const { file, userId, onProgress, onComplete, onError } = options;
    
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      onProgress?.('Processing document locally...');
      
      let extractedText = '';
      
      // Process based on file type
      if (file.type === 'application/pdf') {
        onProgress?.('Extracting text from PDF...');
        extractedText = await ModernPdfProcessor.extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onProgress?.('Extracting text from Word document...');
        extractedText = await ModernPdfProcessor.extractTextFromDOCX(file);
      } else if (file.type === 'text/plain') {
        onProgress?.('Reading text file...');
        extractedText = await ModernPdfProcessor.extractTextFromTXT(file);
      } else if (file.type.startsWith('image/')) {
        throw new Error('Image files require OCR processing. Please convert to text or use a document format.');
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document.');
      }
      
      // Limit text length for performance
      const maxLength = 50000; // Characters
      if (extractedText.length > maxLength) {
        console.warn(`Text truncated from ${extractedText.length} to ${maxLength} characters`);
        extractedText = extractedText.substring(0, maxLength) + '...\n[Text truncated due to length]';
      }
      
      onProgress?.('Processing complete!');
      onComplete?.(extractedText);
      
      return extractedText;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Document processing failed:', error);
      
      onError?.(errorMessage);
      throw new Error(errorMessage);
    }
  }
}