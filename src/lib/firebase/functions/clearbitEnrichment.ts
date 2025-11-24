
import { callHttpFunction } from "./utils";

export const clearbitEnrichment = async (payload: any): Promise<any> => {
  return callHttpFunction("clearbitEnrichment", { body: payload });
};
