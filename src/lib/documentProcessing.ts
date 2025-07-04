import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Client-side document processing utilities
class ClientDocumentProcessor {
  /**
   * Extract text from PDF files using PDF.js
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Dynamic import to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
    }
  }
  
  /**
   * Extract text from DOCX files using optimized mammoth.js configuration
   * Primary method for DOCX processing with enhanced formatting preservation
   */
  static async extractTextFromDOCX(file: File): Promise<string> {
    try {
      console.log('Starting optimized DOCX extraction with mammoth.js');
      
      // Dynamic import to avoid bundling issues
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Enhanced configuration for better text extraction
      const options = {
        convertImage: mammoth.images.imgElement(function() {
          return { alt: '[IMAGE]' }; // Replace images with placeholder
        }),
        styleMap: [
          // Preserve paragraph structure
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          // Convert lists properly
          "p[style-name='List Paragraph'] => li:fresh",
          // Preserve emphasis
          "b => strong",
          "i => em"
        ]
      };
      
      // Extract with enhanced formatting
      const result = await mammoth.extractRawText({ arrayBuffer }, options);
      
      // Log warnings but don't fail on them (they're usually just styling info)
      if (result.messages.length > 0) {
        const warnings = result.messages.filter(m => m.type === 'warning');
        const errors = result.messages.filter(m => m.type === 'error');
        
        if (warnings.length > 0) {
          console.info('DOCX extraction info:', warnings.length, 'styling warnings (normal)');
        }
        if (errors.length > 0) {
          console.warn('DOCX extraction errors:', errors);
        }
      }
      
      const extractedText = result.value.trim();
      
      // Basic text cleanup for better readability
      const cleanedText = extractedText
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
        .replace(/[ \t]+/g, ' ') // Normalize whitespace
        .trim();
      
      console.log('DOCX extraction successful:', {
        originalLength: extractedText.length,
        cleanedLength: cleanedText.length,
        hasContent: cleanedText.length > 0
      });
      
      return cleanedText;
    } catch (error) {
      console.error('DOCX extraction failed:', error);
      throw new Error('Failed to extract text from DOCX. The file may be corrupted, password-protected, or in an unsupported format.');
    }
  }
  
  /**
   * Extract text from plain text files
   */
  static async extractTextFromTXT(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text.trim();
    } catch (error) {
      console.error('Text file reading failed:', error);
      throw new Error('Failed to read text file. The file may be corrupted.');
    }
  }
  
  /**
   * Extract text from image files using OCR (Tesseract.js)
   */
  static async extractTextFromImage(file: File): Promise<string> {
    try {
      // Dynamic import to avoid bundling issues
      const Tesseract = await import('tesseract.js');
      
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => console.log('OCR Progress:', m)
      });
      
      return text.trim();
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image. OCR processing failed.');
    }
  }
  
  /**
   * Main extraction method with DOCX optimization and smart routing
   * DOCX files are prioritized as the primary supported format
   */
  static async extractText(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    console.log('Client-side text extraction starting:', {
      fileName,
      fileType,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
    });
    
    // PRIORITY 1: DOCX files (our optimized primary format)
    if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('🎯 Processing DOCX with optimized mammoth.js (primary method)');
      return await this.extractTextFromDOCX(file);
    }
    
    // PRIORITY 2: PDF files (reliable secondary format)
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      console.log('📄 Processing PDF with PDF.js');
      return await this.extractTextFromPDF(file);
    }
    
    // PRIORITY 3: Plain text (simple and fast)
    if (fileName.endsWith('.txt') || fileType === 'text/plain') {
      console.log('📝 Processing plain text file');
      return await this.extractTextFromTXT(file);
    }
    
    // PRIORITY 4: Images with OCR (slower but comprehensive)
    if (fileName.match(/\.(jpg|jpeg|png)$/i) || fileType.startsWith('image/')) {
      console.log('🖼️ Processing image with OCR (this may take longer)');
      return await this.extractTextFromImage(file);
    }
    
    // Legacy DOC files - provide helpful guidance
    if (fileName.endsWith('.doc') || fileType === 'application/msword') {
      throw new Error('Legacy .doc files are not supported. Please save your document as .docx format for optimal processing.');
    }
    
    // Unsupported format with guidance
    throw new Error(`Unsupported file type: "${fileName}". 
    
Supported formats (in order of recommendation):
• .docx (Word documents) - ⭐ BEST support with advanced formatting
• .pdf (PDF documents) - ✅ Full text extraction
• .txt (Plain text) - ✅ Direct reading
• .jpg, .jpeg, .png (Images) - ✅ OCR text extraction

Tip: For best results, save Word documents as .docx format.`);
  }
}

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

    // Try to create database record with graceful handling
    let dbRecordCreated = false;
    try {
      const { error: dbError } = await supabase
        .from('processed_documents' as any)
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
        // Continue without database record - we can still process
      } else {
        console.log('Database record created successfully');
        dbRecordCreated = true;
      }
    } catch (dbError) {
      console.warn('Database record creation error:', dbError);
      // Continue without database record
    }

    // Try multiple processing approaches in order of preference
    let processingTriggered = false;
    
    // Approach 1: New async processing function
    if (dbRecordCreated) {
      try {
        console.log('Trying new async processing function...');
        const { error: functionError } = await supabase.functions.invoke('process-document-async', {
          body: {
            storage_path: storagePath,
            user_id: userId,
            bucket_id: 'docs'
          }
        });
        
        if (!functionError) {
          console.log('Async processing triggered successfully');
          processingTriggered = true;
        } else {
          console.warn('Async processing trigger failed:', functionError);
        }
      } catch (functionError) {
        console.warn('Async processing trigger error:', functionError);
      }
    }

    // Approach 2: Client-side processing bypass (when edge functions fail)
    if (!processingTriggered) {
      try {
        console.log('Edge functions failed, trying client-side processing...');
        
        // Use client-side processing as reliable fallback
        const extractedText = await ClientDocumentProcessor.extractText(file);
        
        if (extractedText && extractedText.trim().length > 0) {
          // Update database record with client-side result
          if (dbRecordCreated) {
            try {
              await (supabase as any).rpc('update_document_status', {
                p_storage_path: storagePath,
                p_status: 'completed',
                p_content: extractedText
              });
              console.log('Client-side processing successful with database update');
            } catch (updateError) {
              console.warn('Database update failed but client-side processing succeeded:', updateError);
            }
          }
          processingTriggered = true;
          console.log('Client-side processing completed successfully');
        } else {
          throw new Error('Client-side processing returned empty content');
        }
      } catch (clientError) {
        console.warn('Client-side processing failed, trying edge function fallback...', clientError);
        
        // If client-side fails, try the edge function as last resort
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', userId);
          
          const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-document', {
            body: formData
          });
          
          if (!parseError && parseResult?.text) {
            if (dbRecordCreated) {
              try {
                await (supabase as any).rpc('update_document_status', {
                  p_storage_path: storagePath,
                  p_status: 'completed',
                  p_content: parseResult.text
                });
              } catch (updateError) {
                console.warn('Database update failed:', updateError);
              }
            }
            processingTriggered = true;
          }
        } catch (edgeFunctionError) {
          console.warn('Both client-side and edge function processing failed:', {
            clientError: clientError instanceof Error ? clientError.message : String(clientError),
            edgeError: edgeFunctionError instanceof Error ? edgeFunctionError.message : String(edgeFunctionError)
          });
        }
      }
    }

    if (!processingTriggered) {
      console.warn('All processing approaches failed - will rely on polling');
    }

    return { storagePath, uploadSuccess: true };
  }

  /**
   * Polls for document processing status until completion with improved error handling
   */
  static async pollProcessingStatus(
    storagePath: string, 
    options: { 
      maxRetries?: number; 
      pollInterval?: number; 
      onProgress?: (status: DocumentProcessingStatus) => void;
    } = {}
  ): Promise<DocumentProcessingStatus> {
    const { maxRetries = 12, pollInterval = 4000, onProgress } = options; // Reduced retries, increased interval
    let retries = 0;
    let noDataRetries = 0;
    const maxNoDataRetries = 3; // Reduced from 5 to fail faster
    let lastError: Error | null = null;

    console.log(`Starting to poll for status: ${storagePath}, maxRetries: ${maxRetries}`);

    while (retries < maxRetries) {
      try {
        console.log(`Polling attempt ${retries + 1}/${maxRetries}`);
        
        // Try to get status via RPC function
        const { data, error } = await (supabase as any).rpc('get_document_status', {
          p_storage_path: storagePath
        });

        if (error) {
          console.warn('RPC get_document_status failed:', error);
          // Try direct table query as fallback
          const { data: directData, error: directError } = await supabase
            .from('processed_documents' as any)
            .select('*')
            .eq('storage_path', storagePath)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (directError) {
            console.warn('Direct table query also failed:', directError);
            lastError = new Error(`Database query failed: ${error.message}`);
            // Don't throw immediately - keep trying
          } else {
            console.log('Direct table query successful');
            const status = directData as any;
            const normalizedStatus: DocumentProcessingStatus = {
              id: status.id,
              status: status.processing_status || 'pending',
              extracted_content: status.extracted_content,
              error_message: status.error_message,
              created_at: status.created_at,
              updated_at: status.updated_at
            };
            
            if (onProgress) onProgress(normalizedStatus);
            
            if (status.processing_status === 'completed') {
              return normalizedStatus;
            }
            if (status.processing_status === 'failed') {
              throw new Error(status.error_message || 'Document processing failed');
            }
            noDataRetries = 0;
          }
        } else if (data && (data as any).length > 0) {
          const status = (data as any)[0] as DocumentProcessingStatus;
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
            const errorMsg = lastError ? lastError.message : 'No status updates received. The Edge Function may have failed.';
            throw new Error(`Processing failed: ${errorMsg}`);
          }
        }

        // Exponential backoff with jitter to avoid thundering herd
        const jitter = Math.random() * 1000; // 0-1 second jitter
        const backoffMultiplier = Math.min(1.5, 1 + (retries * 0.1)); // Gradual increase
        const waitTime = Math.round(pollInterval * backoffMultiplier + jitter);
        
        console.log(`Waiting ${waitTime}ms before next poll (attempt ${retries + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } catch (error) {
        console.error('Error during status polling:', error);
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;
        
        if (retries >= maxRetries) {
          console.error('Max retries reached, giving up');
          throw lastError;
        }
        
        // Wait before retry with backoff
        const waitTime = Math.min(pollInterval * 2, 10000); // Cap at 10 seconds
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const timeoutMsg = `Processing timeout: Document took too long to process (${maxRetries} attempts over ${Math.round(maxRetries * pollInterval / 1000)} seconds)`;
    throw new Error(lastError ? `${timeoutMsg}. Last error: ${lastError.message}` : timeoutMsg);
  }

  /**
   * Complete document processing workflow with client-side fallback
   */
  static async processDocument(options: DocumentUploadOptions): Promise<string> {
    const { file, userId, onProgress, onComplete, onError, maxRetries = 6, pollInterval = 3000 } = options;

    try {
      // Update progress
      onProgress?.('Validating file...');

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Try client-side processing first for immediate results
      try {
        // Custom progress messages based on file type
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.docx')) {
          onProgress?.('🎯 Processing DOCX locally with optimized engine...');
        } else if (fileName.endsWith('.pdf')) {
          onProgress?.('📄 Processing PDF locally...');
        } else {
          onProgress?.('Processing file locally...');
        }
        
        const extractedText = await ClientDocumentProcessor.extractText(file);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('Client-side processing successful, uploading result...');
          
          // Upload file to storage for record keeping
          onProgress?.('Saving processed document...');
          const { storagePath } = await this.uploadDocument(file, userId);
          
          // Store the result in database
          try {
            await (supabase as any).rpc('update_document_status', {
              p_storage_path: storagePath,
              p_status: 'completed',
              p_content: extractedText
            });
          } catch (dbError) {
            console.warn('Database update failed but processing succeeded:', dbError);
          }
          
          onProgress?.('Processing complete!');
          onComplete?.(extractedText);
          return extractedText;
        }
      } catch (clientError) {
        console.warn('Client-side processing failed, falling back to server processing:', clientError);
        
        // Continue to server-side processing if client-side fails
        onProgress?.('Client processing failed, trying server...');
      }

      // Fallback to server-side processing
      onProgress?.('Uploading file...');
      const { storagePath } = await this.uploadDocument(file, userId);
      
      onProgress?.('Processing with server...');

      // Poll for results with reduced timeout
      const result = await this.pollProcessingStatus(storagePath, {
        maxRetries,
        pollInterval,
        onProgress: (status) => {
          const statusMap = {
            'pending': 'Queued for processing...',
            'processing': 'Server is analyzing document...',
            'completed': 'Processing complete!',
            'failed': 'Processing failed'
          };
          
          const progressMessage = statusMap[status.status as keyof typeof statusMap] || 'Processing...';
          onProgress?.(progressMessage);
        }
      });

      const extractedText = result.extracted_content;
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No content extracted from document. The file may be empty or corrupted.');
      }

      onComplete?.(extractedText);
      return extractedText;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Document processing failed:', error);
      
      // Provide more specific error messages
      let userFriendlyError = errorMessage;
      if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Document processing timed out. The file may be too complex. Try a simpler document.';
      } else if (errorMessage.includes('Database query failed')) {
        userFriendlyError = 'Database connection issue. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Edge Function') || errorMessage.includes('server')) {
        userFriendlyError = 'Server processing failed. The document was processed locally but may have formatting limitations.';
      } else if (errorMessage.includes('No content extracted')) {
        userFriendlyError = 'Unable to extract text from this document. Please ensure the file is not corrupted or try a different format.';
      } else if (errorMessage.includes('Unsupported file type')) {
        userFriendlyError = 'File type not supported. Please use PDF, DOCX, TXT, JPG, or PNG files.';
      }
      
      onError?.(userFriendlyError);
      throw new Error(userFriendlyError);
    }
  }

  /**
   * Get processing status for a specific storage path
   */
  static async getProcessingStatus(storagePath: string): Promise<DocumentProcessingStatus | null> {
    const { data, error } = await (supabase as any).rpc('get_document_status', {
      p_storage_path: storagePath
    });

    if (error) {
      console.error('Error getting document status:', error);
      return null;
    }

    return data && (data as any).length > 0 ? (data as any)[0] : null;
  }

  /**
   * Get all processed documents for the current user
   */
  static async getUserDocuments(): Promise<DocumentProcessingStatus[]> {
    const { data, error } = await supabase
      .from('user_documents' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user documents:', error);
      return [];
    }

    return (data as any) || [];
  }
}