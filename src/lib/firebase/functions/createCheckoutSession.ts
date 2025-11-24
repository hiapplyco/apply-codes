
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const createCheckoutSession = async (payload: any): Promise<any> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable(functions, "createCheckoutSession");
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.error("Callable createCheckoutSession failed:", error);
    throw error;
  }
};
