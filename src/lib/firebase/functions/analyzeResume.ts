
import { callHttpFunction } from "./utils";

export const analyzeResume = async (payload: any): Promise<any> => {
    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    }
    if (payload.resumeText) {
      formData.append("resumeText", payload.resumeText);
    }
    if (payload.jobDescription) {
      formData.append("jobDescription", payload.jobDescription);
    }
    if (payload.userId) {
      formData.append("userId", payload.userId);
    }

    return callHttpFunction("analyzeResume", { body: formData, isFormData: true });
};
