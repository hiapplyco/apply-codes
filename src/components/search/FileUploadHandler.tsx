
import { useToast } from "@/hooks/use-toast";
import { DocumentProcessor } from "@/lib/documentProcessing";

export interface FileUploadHandlerProps {
  userId: string | null;
  onTextUpdate: (text: string) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

export const FileUploadHandler = ({ userId, onTextUpdate, onProcessingChange }: FileUploadHandlerProps) => {
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) {
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload files",
          variant: "destructive",
        });
      }
      return;
    }

    // Validate file using DocumentProcessor
    const validation = DocumentProcessor.validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error || "Unsupported file type",
        variant: "destructive",
      });
      return;
    }

    onProcessingChange(true);

    try {
      const extractedText = await DocumentProcessor.processDocument({
        file,
        userId,
        onProgress: (status) => {
          // Could show progress in toast if needed
          console.log('Processing status:', status);
        },
        onComplete: (content) => {
          onTextUpdate(content);
          toast({
            title: "File processed",
            description: "The content has been extracted and added to the input field.",
          });
        },
        onError: (error) => {
          toast({
            title: "Processing failed",
            description: error,
            variant: "destructive",
          });
        }
      });

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process the file. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      onProcessingChange(false);
    }
  };

  return handleFileUpload;
};
