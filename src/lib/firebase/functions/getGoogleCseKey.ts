
import { callHttpFunction } from "./utils";

export const getGoogleCseKey = async (): Promise<{ secret: string; engineId: string }> => {
  return callHttpFunction("getGoogleCseKey");
};
