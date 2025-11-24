
import { callHttpFunction } from "./utils";

export const generateLinkedinAnalysis = async (payload: any): Promise<any> => {
  return callHttpFunction("generateLinkedinAnalysis", { body: payload });
};
