
import { callHttpFunction } from "./utils";

export const geminiApi = async (payload: any): Promise<any> => {
  return callHttpFunction("geminiApi", { body: payload });
};
