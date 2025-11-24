
import { callHttpFunction } from "./utils";

export const getGeminiKey = async (): Promise<{ secret: string }> => {
  return callHttpFunction("getGeminiKey");
};
