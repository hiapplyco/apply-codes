
import { callHttpFunction } from "./utils";

export const generateContent = async (payload: any): Promise<any> => {
  return callHttpFunction("generateContent", { body: payload });
};
