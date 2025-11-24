
import { callHttpFunction } from "./utils";

export const processTextExtraction = async (payload: any): Promise<any> => {
    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    }
    if (payload.extractionType) {
      formData.append("extractionType", payload.extractionType);
    }
    if (payload.options) {
      formData.append("options", JSON.stringify(payload.options));
    }
    if (payload.userId) {
      formData.append("userId", payload.userId);
    }
    if (payload.preserveFormatting !== undefined) {
      formData.append("preserveFormatting", String(payload.preserveFormatting));
    }
    if (payload.extractTables !== undefined) {
      formData.append("extractTables", String(payload.extractTables));
    }
    if (payload.ocrEnabled !== undefined) {
      formData.append("ocrEnabled", String(payload.ocrEnabled));
    }
    if (payload.language) {
      formData.append("language", payload.language);
    }
    if (payload.outputFormat) {
      formData.append("outputFormat", payload.outputFormat);
    }
    if (payload.storagePath) {
      formData.append("storagePath", payload.storagePath);
    }
    if (payload.storageUrl) {
      formData.append("storageUrl", payload.storageUrl);
    }

    return callHttpFunction("processTextExtraction", { body: formData, isFormData: true });
};
