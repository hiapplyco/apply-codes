import { toast } from "sonner";

// Simplified document processing with better error handling
class ClientDocumentProcessor {
  /**
   * Extract text from PDF files with improved error handling
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('Starting PDF extraction...');
      
      // Dynamic import to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Use the version number from the imported library
      const pdfVersion = pdfjsLib.version || '3.11.174';
      
      // Set worker source to CDN with exact version
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document with worker disabled if CDN fails
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        disableWorker: true, // This will run PDF.js in the main thread
        verbosity: 0 // Suppress console warnings
      });
      
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      console.log(`Processing ${totalPages} pages from PDF`);
      
      // Extract text from all pages
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          
          fullText += pageText + '\n';
          
          if (i % 10 === 0) {
            console.log(`Processed ${i}/${totalPages} pages`);
          }
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${i}:`, pageError);
          // Continue with other pages instead of failing completely
        }
      }
      
      // Clean up the extracted text
      const cleanedText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      console.log('PDF extraction complete:', {
        totalPages,
        textLength: cleanedText.length
      });
      
      if (cleanedText.length === 0) {
        throw new Error('No text could be extracted from the PDF. It may be image-based or encrypted.');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      // Better error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('The PDF file appears to be corrupted. Please try a different file.');
        }
        if (error.message.includes('password')) {
          throw new Error('The PDF is password-protected. Please remove the password and try again.');
        }
        throw error;
      }
      
      throw new Error('Failed to process the PDF file. Please try again.');
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
   * Process document with client-side extraction only (no server fallback)
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
        extractedText = await ClientDocumentProcessor.extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onProgress?.('Extracting text from Word document...');
        extractedText = await ClientDocumentProcessor.extractTextFromDOCX(file);
      } else if (file.type === 'text/plain') {
        onProgress?.('Reading text file...');
        extractedText = await ClientDocumentProcessor.extractTextFromTXT(file);
      } else if (file.type.startsWith('image/')) {
        // For images, we can't process locally
        throw new Error('Image files require server-side OCR processing, which is currently unavailable.');
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
