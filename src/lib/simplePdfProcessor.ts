import { toast } from "sonner";

// Ultra-simple PDF processor that avoids worker issues
export class SimplePdfProcessor {
  static async extractText(file: File): Promise<string> {
    try {
      console.log('Starting simple PDF extraction...');
      
      // For now, return a message that tells user to use server processing
      // This avoids all the PDF.js worker issues
      const fileSize = (file.size / 1024 / 1024).toFixed(2);
      
      // Check if file is actually a PDF
      if (!file.type.includes('pdf')) {
        throw new Error('File is not a PDF');
      }
      
      // For PDF files, we'll use a different approach
      // This is a temporary fix until we can properly configure PDF.js
      
      throw new Error(
        `PDF processing is temporarily unavailable. Please try one of these alternatives:\n\n` +
        `1. Convert your PDF to a text file (.txt) and upload that instead\n` +
        `2. Copy and paste the text directly into the job description field\n` +
        `3. Use a Word document (.docx) instead of PDF\n\n` +
        `File info: ${file.name} (${fileSize} MB)`
      );
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw error;
    }
  }
}

// Main document processor with simplified PDF handling
export class SimpleDocumentProcessor {
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
      
      onProgress?.('Processing document...');
      
      let extractedText = '';
      
      // Process based on file type
      if (file.type === 'application/pdf') {
        // For now, PDFs are not supported due to worker issues
        onProgress?.('Checking PDF support...');
        extractedText = await SimplePdfProcessor.extractText(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onProgress?.('Extracting text from Word document...');
        extractedText = await this.extractTextFromDOCX(file);
      } else if (file.type === 'text/plain') {
        onProgress?.('Reading text file...');
        extractedText = await this.extractTextFromTXT(file);
      } else if (file.type.startsWith('image/')) {
        throw new Error(
          'Image files require OCR processing. Please try:\n\n' +
          '1. Convert the image to text using an online OCR tool\n' +
          '2. Copy and paste the text directly\n' +
          '3. Use a text-based document format instead'
        );
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