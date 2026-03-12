import { useState, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { firestoreClient } from '@/lib/firebase-database-bridge';
import { DocumentProcessor } from '@/lib/modernPdfProcessor';
import { toast } from 'sonner';

export interface Attachment {
  name: string;
  type: string;
  content: string;
}

interface UseFileAttachmentsParams {
  selectedProjectId?: string | null;
  selectedProject?: { id: string } | null;
}

export function useFileAttachments({ selectedProjectId, selectedProject }: UseFileAttachmentsParams) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveContextItem = useCallback(async (item: any) => {
    if (!auth?.currentUser?.uid) return;

    try {
      await firestoreClient
        .from('context_items')
        .insert({
          ...item,
          user_id: auth.currentUser.uid,
          project_id: selectedProject?.id || selectedProjectId || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving context item:', error);
    }
  }, [selectedProject, selectedProjectId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!auth?.currentUser?.uid) {
      toast.error('You must be logged in to upload files');
      return;
    }

    setIsUploading(true);
    try {
      await DocumentProcessor.processDocument({
        file,
        userId: auth.currentUser.uid,
        onProgress: (status) => {
          if (!status.includes('complete') && !status.includes('failed')) {
            toast.info(status, { duration: 1500, id: 'upload-progress' });
          }
        },
        onComplete: async (content) => {
          toast.success('File processed successfully!', { id: 'upload-progress' });

          await saveContextItem({
            type: 'file_upload',
            title: `Uploaded: ${file.name}`,
            content: content,
            file_name: file.name,
            file_type: file.type,
            summary: content.substring(0, 200) + '...',
            metadata: {
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              success: true,
              timestamp: new Date().toISOString()
            }
          });

          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type,
            content: content
          }]);
        },
        onError: (err) => {
          toast.error(err, { id: 'upload-progress' });
        }
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  return {
    attachments,
    isUploading,
    fileRef,
    handleFileUpload,
    removeAttachment,
    clearAttachments,
  };
}
