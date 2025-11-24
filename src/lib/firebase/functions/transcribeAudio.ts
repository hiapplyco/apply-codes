
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const transcribeAudio = async (payload: any): Promise<any> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable(functions, "transcribeAudio");
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.error("Callable transcribeAudio failed:", error);
    throw error;
  }
};
