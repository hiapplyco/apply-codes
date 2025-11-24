
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DocumentProcessor } from "@/lib/documentProcessing";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

interface FileUploadSectionProps {
  onFileUpload: (filePath: string, fileName: string, text: string) => void;
  isProcessing: boolean;
}

export const FileUploadSection = ({ onFileUpload, isProcessing }: FileUploadSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{fileName: string, status: string} | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const user = auth?.currentUser;
      if (!user?.uid) {
        throw new Error("Authentication required");
      }
      if (!db) {
        throw new Error("Firestore not initialized");
      }

      for (const file of Array.from(files)) {
        // Validate file using DocumentProcessor
        const validation = DocumentProcessor.validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        // Create a unique ID for this upload in the toast system
        const toastId = `upload-${Date.now()}-${file.name}`;
        
        setUploadProgress({
          fileName: file.name,
          status: "Starting upload..."
        });

        try {
          const extractedText = await DocumentProcessor.processDocument({
            file,
            userId: user.uid,
            onProgress: (status) => {
              setUploadProgress({
                fileName: file.name,
                status
              });
              toast.loading(`${file.name}: ${status}`, { id: toastId });
            },
            onComplete: async (content) => {
              try {
                await addDoc(collection(db, 'kickoff_summaries'), {
                  content,
                  source: `file:${file.name}`,
                  user_id: user.uid,
                  created_at: serverTimestamp()
                });
              } catch (summaryError) {
                console.error('Error storing summary:', summaryError);
                toast.error(`Failed to store summary for ${file.name}`, { id: toastId });
                return;
              }

              // Generate a storage path for compatibility
              const storagePath = `processed/${user.uid}/${Date.now()}-${file.name}`;
              onFileUpload(storagePath, file.name, content);
              
              toast.success(`Successfully processed ${file.name}`, { 
                id: toastId,
                className: "animate-fade-in",
              });
            },
            onError: (error) => {
              toast.error(`Failed to process ${file.name}: ${error}`, { id: toastId });
            }
          });

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to process ${file.name}: ${errorMessage}`, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error("Failed to process files. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (event.target) event.target.value = '';
    }
  };

  const showProcessing = isProcessing || isUploading;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          disabled={showProcessing}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded font-bold",
            "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5",
            "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer",
            "animate-in fade-in duration-300",
            showProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {showProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {showProcessing ? 'Processing...' : 'Upload Files'}
        </label>
        <span className="text-sm text-gray-500">
          {showProcessing ? (
            <div className="flex items-center gap-2">
              <span className="animate-pulse">Processing your files</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : (
            'Accepts PDF, DOC, DOCX, TXT, JPG, PNG (max 20MB each)'
          )}
        </span>
      </div>

      {uploadProgress && (
        <div className="mt-2 p-3 border-2 border-blue-400 bg-blue-50 rounded-md">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <div>
              <p className="font-medium text-blue-700">{uploadProgress.fileName}</p>
              <p className="text-sm text-blue-600">{uploadProgress.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
