
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const analyzeCandidate = async (payload: any): Promise<any> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable(functions, "analyzeCandidate");
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.error("Callable analyzeCandidate failed:", error);
    throw error;
  }
};
