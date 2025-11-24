
import { callHttpFunction } from "./utils";

export const extractNlpTerms = async (payload: any): Promise<any> => {
  return callHttpFunction("extractNlpTerms", { body: payload });
};
