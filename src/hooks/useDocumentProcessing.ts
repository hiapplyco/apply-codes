import { useState, useEffect, useCallback } from 'react';
import { DocumentProcessor, DocumentProcessingStatus } from '@/lib/documentProcessing';

export interface UseDocumentProcessingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useDocumentProcessing = (options: UseDocumentProcessingOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 5000 } = options;
  
  const [documents, setDocuments] = useState<DocumentProcessingStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await DocumentProcessor.getUserDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentStatus = useCallback(async (storagePath: string) => {
    try {
      const status = await DocumentProcessor.getProcessingStatus(storagePath);
      return status;
    } catch (err) {
      console.error('Error getting document status:', err);
      return null;
    }
  }, []);

  const uploadDocument = useCallback(async (
    file: File, 
    userId: string,
    onProgress?: (status: string) => void
  ) => {
    try {
      const result = await DocumentProcessor.processDocument({
        file,
        userId,
        onProgress
      });
      
      // Refresh the documents list after successful upload
      await fetchDocuments();
      return result;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  }, [fetchDocuments]);

  // Auto-refresh documents
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDocuments, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDocuments]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    getDocumentStatus,
    uploadDocument,
    // Helper functions
    hasPendingDocuments: documents.some(doc => doc.status === 'pending' || doc.status === 'processing'),
    completedDocuments: documents.filter(doc => doc.status === 'completed'),
    failedDocuments: documents.filter(doc => doc.status === 'failed'),
  };
};