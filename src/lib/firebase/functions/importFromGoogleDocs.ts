
import { callHttpFunction } from "./utils";

export const importFromGoogleDocs = async (payload: any): Promise<any> => {
  return callHttpFunction("importFromGoogleDocs", { body: payload });
};
