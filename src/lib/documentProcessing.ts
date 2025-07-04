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
    'image/jpg',
    // Common variations browsers might report
    'application/octet-stream', // Generic binary - often reported for .docx
    'application/zip', // Some browsers report .docx as zip
    'application/vnd.ms-word', // Alternative Word format
    'application/vnd.ms-word.document.macroEnabled.12', // .docm files
    '', // Empty MIME type - some browsers don't set it
    'application/x-pdf', // Alternative PDF MIME type
    'text/pdf' // Some systems report PDF as text
  ];

  private static readonly SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  /**
   * Validates if a file is supported for processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    console.log('DocumentProcessor.validateFile:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
    });

    // Check file size (convert to MB for debugging)
    const fileSizeMB = file.size / 1024 / 1024;
    const maxSizeMB = this.MAX_FILE_SIZE / 1024 / 1024;
    
    if (file.size > this.MAX_FILE_SIZE) {
      console.error('File too large:', { fileSizeMB, maxSizeMB });
      return { valid: false, error: `File size (${fileSizeMB.toFixed(1)}MB) exceeds ${maxSizeMB}MB limit. Please use a smaller file.` };
    }

    // Check file extension first (more reliable than MIME type)
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    // If extension is valid, accept the file regardless of MIME type
    if (hasValidExtension) {
      console.log('File validation passed (valid extension):', { fileName, extension: fileName.split('.').pop() });
      return { valid: true };
    }
    
    // If extension check fails, check MIME type as fallback
    const hasValidMimeType = this.SUPPORTED_TYPES.includes(file.type);

    console.log('File validation (checking MIME type):', {
      fileName,
      fileType: file.type,
      hasValidExtension,
      hasValidMimeType,
      supportedTypes: this.SUPPORTED_TYPES,
      supportedExtensions: this.SUPPORTED_EXTENSIONS
    });

    // Accept file if MIME type is valid
    if (hasValidMimeType) {
      console.log('File validation passed (valid MIME type)');
      return { valid: true };
    }

    // Neither extension nor MIME type is valid
    console.error('Invalid file type:', { fileType: file.type, fileName });
    return { 
      valid: false, 
      error: `Unsupported file: "${file.name}". Please use: PDF, DOC, DOCX, TXT, JPG, or PNG files` 
    };
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
    // Use a generic MIME type for better compatibility with bucket restrictions
    let uploadMimeType = file.type;
    
    // If the exact MIME type might not be allowed, use a generic one
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.type === 'application/zip') {
      uploadMimeType = 'application/octet-stream'; // Generic binary type
    }
    
    console.log('Upload MIME type mapping:', { original: file.type, upload: uploadMimeType });
    
    const { error: uploadError } = await supabase.storage
      .from('docs')
      .upload(storagePath, file, {
        contentType: uploadMimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // Provide more specific error messages
      let errorMessage = uploadError.message || 'Unknown upload error';
      if (errorMessage.includes('not-null constraint') || errorMessage.includes('processed_documents')) {
        errorMessage = 'Database setup incomplete. Please run the document processing setup SQL.';
      } else if (errorMessage.includes('mime type') && errorMessage.includes('not supported')) {
        errorMessage = 'File type not allowed by storage bucket. Please run the bucket MIME type fix.';
      } else if (errorMessage.includes('size') || errorMessage.includes('limit')) {
        errorMessage = 'File exceeds storage bucket size limit.';
      }
      
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    // Manually create database record (since trigger isn't working)
    try {
      const { error: dbError } = await supabase
        .from('processed_documents')
        .insert({
          user_id: userId,
          storage_path: storagePath,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          processing_status: 'pending'
        });
        
      if (dbError) {
        console.warn('Database record creation failed:', dbError);
        // Don't throw - file upload succeeded, we can still process it
      } else {
        console.log('Database record created successfully');
      }
    } catch (dbError) {
      console.warn('Database record creation error:', dbError);
      // Don't throw - file upload succeeded
    }

    // Manually trigger processing (since storage trigger isn't working)
    try {
      console.log('Manually triggering document processing...');
      const { error: functionError } = await supabase.functions.invoke('process-document-async', {
        body: {
          storage_path: storagePath,
          user_id: userId,
          bucket_id: 'docs'
        }
      });
      
      if (functionError) {
        console.warn('Manual processing trigger failed:', functionError);
        
        // Try the old parse-document function as fallback
        console.log('Trying fallback to old parse-document function...');
        try {
          // Download the file and process with old function
          const { data: fileData } = await supabase.storage.from('docs').download(storagePath);
          if (fileData) {
            const formData = new FormData();
            formData.append('file', fileData, file.name);
            formData.append('userId', userId);
            
            const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-document', {
              body: formData
            });
            
            if (!parseError && parseResult?.text) {
              // Update the database record with the result
              await supabase.rpc('update_document_status', {
                p_storage_path: storagePath,
                p_status: 'completed',
                p_content: parseResult.text
              });
              console.log('Fallback processing successful');
            }
          }
        } catch (fallbackError) {
          console.warn('Fallback processing also failed:', fallbackError);
        }
      } else {
        console.log('Processing triggered successfully');
      }
    } catch (functionError) {
      console.warn('Manual processing trigger error:', functionError);
      // Don't throw - we can still poll for results
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
    const { maxRetries = 15, pollInterval = 3000, onProgress } = options; // Reduced retries and increased interval
    let retries = 0;
    let noDataRetries = 0;
    const maxNoDataRetries = 5; // Give up if no data found after 5 attempts

    console.log(`Starting to poll for status: ${storagePath}, maxRetries: ${maxRetries}`);

    while (retries < maxRetries) {
      try {
        console.log(`Polling attempt ${retries + 1}/${maxRetries}`);
        
        const { data, error } = await supabase.rpc('get_document_status', {
          p_storage_path: storagePath
        });

        if (error) {
          console.error('Error getting document status:', error);
          throw new Error(`Failed to get processing status: ${error.message}`);
        }

        if (data && data.length > 0) {
          const status = data[0] as DocumentProcessingStatus;
          console.log('Got status:', status.status);
          
          if (onProgress) {
            onProgress(status);
          }

          // Check if processing is complete
          if (status.status === 'completed') {
            console.log('Processing completed successfully');
            return status;
          }

          if (status.status === 'failed') {
            console.log('Processing failed:', status.error_message);
            throw new Error(status.error_message || 'Document processing failed');
          }
          
          // Reset no-data counter since we got data
          noDataRetries = 0;
        } else {
          console.log('No status data found');
          noDataRetries++;
          
          // If we keep getting no data, the processing might have failed
          if (noDataRetries >= maxNoDataRetries) {
            throw new Error('Processing failed: No status updates received. The Edge Function may have failed.');
          }
        }

        // Wait before next poll
        console.log(`Waiting ${pollInterval}ms before next poll...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        retries++;
      } catch (error) {
        console.error('Error during status polling:', error);
        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached, giving up');
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Processing timeout: Document took too long to process (${maxRetries} attempts over ${Math.round(maxRetries * pollInterval / 1000)} seconds)`);
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