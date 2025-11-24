
import { callHttpFunction } from "./utils";

export const generateEmailTemplates = async (payload: any): Promise<any> => {
  return callHttpFunction("generateEmailTemplates", { body: payload });
};
