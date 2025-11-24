
import { callHttpFunction } from "./utils";

export const exportToGoogleDocs = async (payload: any): Promise<any> => {
  return callHttpFunction("exportToGoogleDocs", { body: payload });
};
