import { toast } from "sonner";

// Modern PDF processor using unpdf library
export class ModernPdfProcessor {
  /**
   * Extract text from PDF using unpdf (no worker issues)
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('Starting modern PDF extraction with unpdf...');
      
      // Dynamic imports to avoid bundling issues
      const { extractText, getDocumentProxy, definePDFJSModule } = await import('unpdf');
      
      // Initialize unpdf with the serverless PDF.js build
      await definePDFJSModule(() => import('unpdf/pdfjs'));
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Get PDF document proxy
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
      
      // Extract text from all pages
      const result = await extractText(pdf, {
        mergePages: true // Merge all pages into single text
      });
      
      console.log('PDF extraction successful:', {
        totalPages: pdf.numPages,
        textLength: result.text.length
      });
      
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. It may be image-based or encrypted.');
      }
      
      return result.text;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      // If unpdf fails, try alternative approach with minimal PDF.js
      console.log('Trying fallback PDF extraction...');
      return ModernPdfProcessor.fallbackPdfExtraction(file);
    }
  }

  /**
   * Fallback PDF extraction using minimal PDF.js setup
   */
  static async fallbackPdfExtraction(file: File): Promise<string> {
    try {
      // Dynamic import of PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up worker-less configuration
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Create loading task with inline worker
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true,
        disableRange: true,
        disableStream: true,
        isEvalSupported: false,
        verbosity: 0
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extract text items
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageNum}:`, pageError);
        }
      }
      
      const cleanedText = fullText.trim();
      
      if (!cleanedText) {
        throw new Error('No text could be extracted from the PDF.');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('Fallback PDF extraction also failed:', error);
      throw new Error('Unable to extract text from this PDF. Please try converting it to a text file or Word document.');
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