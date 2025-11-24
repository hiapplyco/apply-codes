
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const enrichProfile = async (payload: any): Promise<any> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable(functions, "enrichProfile");
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.error("Callable enrichProfile failed:", error);
    throw error;
  }
};
