import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentProcessingStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_content?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadOptions {
  file: File;
  userId: string;
  onProgress?: (status: string) => void;
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
  pollInterval?: number;
}

/**
 * Uploads a document to Supabase Storage and monitors processing status
 */
export class DocumentProcessor {
  private static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  private static readonly SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  /**
   * Validates if a file is supported for processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 20MB limit. Please use a smaller file.` };
    }

    // Check MIME type and extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = this.SUPPORTED_TYPES.includes(file.type);

    if (!hasValidMimeType && !hasValidExtension) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG` 
      };
    }

    return { valid: true };
  }

  /**
   * Uploads a document and returns the processing status immediately
   */
  static async uploadDocument(file: File, userId: string): Promise<{ storagePath: string; uploadSuccess: boolean }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    console.log('Uploading to storage path:', storagePath);

    // Upload directly to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('docs')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    return { storagePath, uploadSuccess: true };
  }

  /**
   * Polls for document processing status until completion
   */
  static async pollProcessingStatus(
    storagePath: string, 
    options: { 
      maxRetries?: number; 
      pollInterval?: number; 
      onProgress?: (status: DocumentProcessingStatus) => void;
    } = {}
  ): Promise<DocumentProcessingStatus> {
    const { maxRetries = 30, pollInterval = 2000, onProgress } = options;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const { data, error } = await supabase.rpc('get_document_status', {
          p_storage_path: storagePath
        });

        if (error) {
          console.error('Error getting document status:', error);
          throw new Error(`Failed to get processing status: ${error.message}`);
        }

        if (data && data.length > 0) {
          const status = data[0] as DocumentProcessingStatus;
          
          if (onProgress) {
            onProgress(status);
          }

          // Check if processing is complete
          if (status.status === 'completed') {
            return status;
          }

          if (status.status === 'failed') {
            throw new Error(status.error_message || 'Document processing failed');
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        retries++;
      } catch (error) {
        console.error('Error during status polling:', error);
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Processing timeout: Document took too long to process');
  }

  /**
   * Complete document processing workflow: upload + poll + return result
   */
  static async processDocument(options: DocumentUploadOptions): Promise<string> {
    const { file, userId, onProgress, onComplete, onError, maxRetries = 30, pollInterval = 2000 } = options;

    try {
      // Update progress
      onProgress?.('Validating file...');

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Update progress
      onProgress?.('Uploading file...');

      // Upload to storage
      const { storagePath } = await this.uploadDocument(file, userId);
      
      // Update progress
      onProgress?.('Processing with AI...');

      // Poll for results
      const result = await this.pollProcessingStatus(storagePath, {
        maxRetries,
        pollInterval,
        onProgress: (status) => {
          switch (status.status) {
            case 'pending':
              onProgress?.('Queued for processing...');
              break;
            case 'processing':
              onProgress?.('AI is analyzing document...');
              break;
            case 'completed':
              onProgress?.('Processing complete!');
              break;
            case 'failed':
              onProgress?.('Processing failed');
              break;
          }
        }
      });

      const extractedText = result.extracted_content;
      if (!extractedText) {
        throw new Error('No content extracted from document');
      }

      onComplete?.(extractedText);
      return extractedText;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Get processing status for a specific storage path
   */
  static async getProcessingStatus(storagePath: string): Promise<DocumentProcessingStatus | null> {
    const { data, error } = await supabase.rpc('get_document_status', {
      p_storage_path: storagePath
    });

    if (error) {
      console.error('Error getting document status:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Get all processed documents for the current user
   */
  static async getUserDocuments(): Promise<DocumentProcessingStatus[]> {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user documents:', error);
      return [];
    }

    return data || [];
  }
}