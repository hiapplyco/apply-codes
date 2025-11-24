
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface BooleanSearchPayload {
  description: string;
  jobTitle?: string;
  userId?: string;
  contextItems?: any[];
}

interface BooleanSearchResponse {
  success: boolean;
  searchString?: string;
  error?: string;
}

export const generateBooleanSearch = async (payload: BooleanSearchPayload): Promise<BooleanSearchResponse> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable<BooleanSearchPayload, BooleanSearchResponse>(functions, "generateBooleanSearch");
    const result = await callable(payload);
    
    if (!result.data.success || !result.data.searchString) {
      return {
        success: false,
        error: result.data.error || "Failed to generate boolean search"
      };
    }

    return result.data;
  } catch (error) {
    console.error("Callable generateBooleanSearch failed:", error);
    throw error;
  }
};
