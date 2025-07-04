import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { DocumentProcessor } from '@/lib/documentProcessing';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { toast } from 'sonner';
import { useAuthSession } from '@/hooks/useAuthSession';

/**
 * Example component demonstrating the new document processing workflow
 * This shows how the upload-then-poll approach works
 */
export const DocumentProcessingExample = () => {
  const { session } = useAuthSession();
  const { documents, loading, uploadDocument, hasPendingDocuments } = useDocumentProcessing({
    autoRefresh: true,
    refreshInterval: 3000
  });
  
  const [uploading, setUploading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) {
      toast.error('Please select a file and ensure you\'re logged in');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file, session.user.id, (status) => {
        setCurrentProgress(status);
      });
      toast.success('Document processed successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setCurrentProgress('');
      if (event.target) event.target.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'processing':
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!session) {
    return (
      <div className="p-6 border-2 border-gray-200 rounded-lg">
        <p className="text-gray-600">Please log in to use document processing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-4">Enhanced Document Processing</h2>
        <p className="text-gray-600 mb-4">
          Upload documents and watch them process asynchronously. Supports PDF, DOCX, DOC, TXT, JPG, PNG files up to 20MB.
        </p>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="demo-file-upload"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            disabled={uploading}
          />
          <label
            htmlFor="demo-file-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white border-2 border-black rounded font-bold
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5
              hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Processing...' : 'Upload Document'}
          </label>
          
          {uploading && currentProgress && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 animate-spin" />
              {currentProgress}
            </div>
          )}
        </div>

        {hasPendingDocuments && (
          <div className="mt-4 p-3 border-2 border-yellow-400 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-700">
              <Clock className="h-4 w-4 inline mr-1" />
              You have documents currently being processed. They will update automatically when complete.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-2 border-black rounded-lg bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-bold mb-4">Your Documents</h3>
        
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No documents uploaded yet. Upload your first document above!
          </p>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 10).map((doc) => (
              <div
                key={doc.id}
                className={`p-4 border-2 rounded-lg ${getStatusColor(doc.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium">{doc.original_filename}</p>
                      <p className="text-sm text-gray-500">
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        {doc.status === 'completed' && doc.extracted_content && (
                          <span className="ml-2">
                            • {doc.extracted_content.length} characters extracted
                          </span>
                        )}
                        {doc.status === 'failed' && doc.error_message && (
                          <span className="ml-2 text-red-600">
                            • {doc.error_message}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {doc.status === 'completed' && doc.extracted_content && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(doc.extracted_content || '');
                        toast.success('Content copied to clipboard!');
                      }}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Copy Text
                    </Button>
                  )}
                </div>
                
                {doc.status === 'completed' && doc.extracted_content && (
                  <div className="mt-3 p-3 bg-white border rounded text-sm">
                    <p className="text-gray-600 font-medium mb-1">Extracted Content:</p>
                    <p className="text-gray-800 line-clamp-3">
                      {doc.extracted_content.substring(0, 200)}
                      {doc.extracted_content.length > 200 && '...'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
        <h4 className="font-bold text-blue-800 mb-2">How it works:</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Upload a file to Supabase Storage</li>
          <li>Storage trigger automatically invokes processing Edge Function</li>
          <li>AI processes the document asynchronously</li>
          <li>Status updates in real-time via polling</li>
          <li>Extracted content is stored in the database</li>
        </ol>
      </div>
    </div>
  );
};