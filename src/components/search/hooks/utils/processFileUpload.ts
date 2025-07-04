
import { toast } from "sonner";
import { DocumentProcessor } from "@/lib/documentProcessing";

export const processFileUpload = async (
  file: File,
  userId: string | null,
  setSearchText: (text: string) => void,
  setIsProcessing: (isProcessing: boolean) => void
) => {
  if (!file || !userId) {
    toast.error("Please select a file and ensure you're logged in");
    return;
  }

  // Validate file
  const validation = DocumentProcessor.validateFile(file);
  if (!validation.valid) {
    toast.error(validation.error || "Invalid file type");
    return;
  }

  setIsProcessing(true);
  
  // Create toast ID for progress tracking
  const toastId = `upload-${Date.now()}-${file.name}`;
  toast.loading("Uploading file...", { id: toastId });

  try {
    const extractedText = await DocumentProcessor.processDocument({
      file,
      userId,
      onProgress: (status) => {
        toast.loading(status, { id: toastId });
      },
      onComplete: (content) => {
        setSearchText(content);
        toast.success("File processed successfully. The content has been extracted and added to the input field.", { id: toastId });
      },
      onError: (error) => {
        toast.error(`Failed to process file: ${error}`, { id: toastId });
      }
    });

    // The onComplete callback will handle setting the search text
    // This is just a fallback
    if (extractedText && !extractedText.includes('onComplete')) {
      setSearchText(extractedText);
    }

  } catch (error) {
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process the file. Please try again.";
    toast.error(errorMessage, { id: toastId });
  } finally {
    setIsProcessing(false);
  }
};
