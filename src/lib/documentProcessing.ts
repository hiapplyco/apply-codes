import { functionBridge } from "@/lib/function-bridge";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { uploadDocument as uploadDocumentToStorage, storageManager } from "@/lib/firebase-storage";

// Client-side document processing utilities
class ClientDocumentProcessor {
  /**
   * Extract text from PDF files using optimized PDF.js with reliable worker setup
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('Starting optimized PDF extraction with PDF.js');
      
      // Dynamic import to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Multiple fallback options for worker source to avoid CORS issues
      const workerSources = [
        // Option 1: jsdelivr (more reliable than cdnjs)
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
        // Option 2: unpkg (alternative CDN)
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
        // Option 3: Use PDF.js without worker (slower but works)
        undefined
      ];
      
      let pdf;
      let workerSetupSuccessful = false;
      
      // Try each worker source until one works
      for (const workerSrc of workerSources) {
        try {
          if (workerSrc) {
            console.log('Trying PDF worker source:', workerSrc);
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          } else {
            console.log('Using PDF.js in main thread (no worker)');
            // Disable worker to run in main thread
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
          }
          
          const arrayBuffer = await file.arrayBuffer();
          
          // Test worker by trying to load the document
          pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            useWorkerFetch: !!workerSrc,
            isEvalSupported: false,
            useSystemFonts: true
          }).promise;
          
          workerSetupSuccessful = true;
          console.log('PDF worker setup successful:', workerSrc || 'main-thread');
          break;
        } catch (workerError) {
          console.warn('PDF worker source failed:', workerSrc, workerError.message);
          continue;
        }
      }
      
      if (!pdf) {
        throw new Error('All PDF worker configurations failed');
      }
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      console.log(`Processing ${totalPages} pages from PDF`);
      
      // Extract text from all pages
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Enhanced text extraction with better formatting
          const pageText = textContent.items
            .map((item: any) => {
              // Preserve some spacing and structure
              const text = item.str || '';
              const hasEOL = item.hasEOL;
              return text + (hasEOL ? '\n' : ' ');
            })
            .join('');
          
          fullText += pageText;
          
          if (i % 5 === 0) {
            console.log(`Processed ${i}/${totalPages} pages`);
          }
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${i}:`, pageError);
          fullText += `[Page ${i} - text extraction failed]\n`;
        }
      }
      
      // Clean up the extracted text
      const cleanedText = fullText
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
        .trim();
      
      console.log('PDF extraction successful:', {
        totalPages,
        originalLength: fullText.length,
        cleanedLength: cleanedText.length,
        workerUsed: workerSetupSuccessful,
        hasContent: cleanedText.length > 0
      });
      
      if (cleanedText.length === 0) {
        throw new Error('PDF contains no extractable text. It may be an image-based PDF or encrypted.');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to extract text from PDF.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
          errorMessage = 'PDF file appears to be corrupted or invalid.';
        } else if (error.message.includes('password') || error.message.includes('encrypted')) {
          errorMessage = 'PDF is password-protected or encrypted. Please provide an unprotected version.';
        } else if (error.message.includes('no extractable text')) {
          errorMessage = 'PDF contains no text (may be image-based). Try using OCR or convert to text-based PDF.';
        } else if (error.message.includes('worker')) {
          errorMessage = 'PDF processing failed due to worker configuration. Falling back to server processing.';
        }
      }
      
      throw new Error(errorMessage);
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
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_content?: string;
  error_message?: string;
  storage_path?: string;
  storage_url?: string;
  extraction_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
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
  private static formatDocumentId(storagePath: string): string {
    return storagePath.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private static getDocumentRef(storagePath: string) {
    if (!db) {
      console.warn('[DocumentProcessor] Firestore not initialized; document tracking disabled.');
      return null;
    }

    return doc(db, 'processed_documents', this.formatDocumentId(storagePath));
  }

  private static async updateDocumentStatus(
    storagePath: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const docRef = this.getDocumentRef(storagePath);
    if (!docRef) {
      return;
    }

    try {
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('[DocumentProcessor] Failed to update document status:', error);
    }
  }

  private static normalizeStatusRecord(
    storagePath: string,
    data: Record<string, any> | undefined | null
  ): DocumentProcessingStatus {
    const statusValue = (data?.status || data?.processing_status || 'pending') as DocumentProcessingStatus['status'];

    return {
      id: data?.id || this.formatDocumentId(storagePath),
      status: statusValue,
      processing_status: data?.processing_status ?? statusValue,
      extracted_content: data?.extracted_content,
      error_message: data?.error_message,
      storage_path: data?.storage_path || storagePath,
      storage_url: data?.storage_url,
      extraction_metadata: data?.extraction_metadata,
      created_at: data?.created_at,
      updated_at: data?.updated_at
    };
  }

  static async uploadDocument(file: File, userId: string): Promise<{
    storagePath: string;
    uploadSuccess: boolean;
    documentId?: string;
    storageUrl?: string;
  }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log('Uploading document with hybrid storage manager:', {
      fileName: file.name,
      userId: userId,
      backend: storageManager.getCurrentBackend()
    });

    try {
      // Use Firebase Storage with backward compatibility fallback
      const { url: documentUrl, storagePath } = await uploadDocumentToStorage(userId, file, (progress) => {
        console.log(`Document upload progress: ${progress}%`);
      });

      console.log('Document uploaded successfully:', { documentUrl, storagePath });

      // Try to create database record with graceful handling
      let documentId: string | undefined;
      const docRef = this.getDocumentRef(storagePath);
      if (docRef) {
        try {
          const timestamp = new Date().toISOString();
          await setDoc(docRef, {
            id: docRef.id,
            user_id: userId,
            storage_path: storagePath,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            status: 'pending',
            processing_status: 'pending',
            storage_url: documentUrl,
            storage_backend: storageManager.getCurrentBackend(),
            created_at: timestamp,
            updated_at: timestamp
          });
          documentId = docRef.id;
          console.log('Document metadata stored in Firestore:', { documentId });
        } catch (firestoreError) {
          console.warn('Failed to store document metadata in Firestore:', firestoreError);
        }
      }

      return {
        storagePath,
        storageUrl: documentUrl,
        documentId,
        uploadSuccess: true
      };

    } catch (error) {
      console.error('Document upload failed:', error);

      // Provide specific error messages based on storage backend
      let errorMessage = 'Document upload failed';
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = 'Please sign in again to upload documents';
        } else if (error.message.includes('quota exceeded')) {
          errorMessage = 'Storage quota exceeded. Please try again later';
        } else if (error.message.includes('unauthorized')) {
          errorMessage = "You don't have permission to upload documents";
        } else if (error.message.includes('invalid format')) {
          errorMessage = 'File format not supported. Please use PDF, DOCX, TXT, JPG, or PNG files';
        } else if (error.message.includes('size') || error.message.includes('limit')) {
          errorMessage = 'File size exceeds limit. Please use a smaller file';
        }
      }

      throw new Error(errorMessage);
    }
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
    const { maxRetries = 12, pollInterval = 4000, onProgress } = options;

    const docRef = this.getDocumentRef(storagePath);
    if (!docRef) {
      throw new Error('Firestore not initialized; cannot poll document status.');
    }

    let retries = 0;
    let lastError: Error | null = null;

    console.log(`Polling processed document status from Firestore: ${storagePath}`);

    while (retries < maxRetries) {
      try {
        console.log(`Polling attempt ${retries + 1}/${maxRetries}`);

        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() || {};
          const status = this.normalizeStatusRecord(storagePath, data);

          onProgress?.(status);

          if (status.status === 'completed') {
            console.log('Processing completed successfully');
            return status;
          }

          if (status.status === 'failed') {
            throw new Error(status.error_message || 'Document processing failed');
          }
        } else {
          console.log('Document status not found in Firestore yet.');
        }

        const jitter = Math.random() * 1000;
        const backoffMultiplier = Math.min(1.5, 1 + retries * 0.1);
        const waitTime = Math.round(pollInterval * backoffMultiplier + jitter);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error('Error while polling document status:', lastError);
        retries++;

        if (retries >= maxRetries) {
          break;
        }

        const waitTime = Math.min(pollInterval * 2, 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const timeoutMsg = `Processing timeout: Document took too long to process (${maxRetries} attempts over ${Math.round(
      (maxRetries * pollInterval) / 1000
    )} seconds)`;
    throw new Error(lastError ? `${timeoutMsg}. Last error: ${lastError.message}` : timeoutMsg);
  }

  /**
   * Complete document processing workflow with client-side fallback
   */
  static async processDocument(options: DocumentUploadOptions): Promise<string> {
    const { file, userId, onProgress, onComplete, onError } = options;

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
          onProgress?.('📄 Processing PDF locally with enhanced extraction...');
        } else {
          onProgress?.('Processing file locally...');
        }
        
        const extractedText = await ClientDocumentProcessor.extractText(file);
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('Client-side processing successful, uploading result...');
          
          // Upload file to storage for record keeping
          onProgress?.(`Saving processed document to ${storageManager.getCurrentBackend()} storage...`);
          const { storagePath, storageUrl } = await this.uploadDocument(file, userId);

          await this.updateDocumentStatus(storagePath, {
            status: 'completed',
            processing_status: 'completed',
            extracted_content: extractedText,
            error_message: null,
            storage_url: storageUrl
          });
          
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
      const { storagePath, storageUrl } = await this.uploadDocument(file, userId);

      onProgress?.(`Processing with Firebase Functions...`);

      const response = await functionBridge.processTextExtraction({
        file,
        userId,
        storagePath,
        storageUrl,
        preserveFormatting: true,
        extractTables: true,
        ocrEnabled: true
      });

      const extractedText =
        response?.data?.text ??
        response?.text ??
        (typeof response === 'string' ? response : null);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No content extracted from document. The file may be empty or corrupted.');
      }

      await this.updateDocumentStatus(storagePath, {
        status: 'completed',
        processing_status: 'completed',
        extracted_content: extractedText,
        error_message: null,
        extraction_metadata: response?.data?.metadata,
        storage_url: storageUrl
      });

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
    const docRef = this.getDocumentRef(storagePath);
    if (!docRef) {
      return null;
    }

    try {
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return null;
      }

      return this.normalizeStatusRecord(storagePath, snapshot.data());
    } catch (error) {
      console.error('Error getting document status from Firestore:', error);
      return null;
    }
  }

  /**
   * Get all processed documents for the current user
   */
  static async getUserDocuments(): Promise<DocumentProcessingStatus[]> {
    if (!db) {
      console.warn('[DocumentProcessor] Firestore not initialized; cannot load documents.');
      return [];
    }

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      console.warn('[DocumentProcessor] No authenticated user; returning empty document list.');
      return [];
    }

    try {
      const documentsQuery = query(
        collection(db, 'processed_documents'),
        where('user_id', '==', currentUser.uid),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(documentsQuery);
      return snapshot.docs.map((docSnap) =>
        this.normalizeStatusRecord(docSnap.data().storage_path || docSnap.id, docSnap.data())
      );
    } catch (error) {
      console.error('Error fetching processed documents from Firestore:', error);
      return [];
    }
  }
}
