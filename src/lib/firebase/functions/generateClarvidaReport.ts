
import { callHttpFunction } from "./utils";

export const generateClarvidaReport = async (payload: any): Promise<any> => {
  return callHttpFunction("generateClarvidaReport", { body: payload });
};
