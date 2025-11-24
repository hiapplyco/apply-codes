
import { callHttpFunction } from "./utils";

export const searchContacts = async (payload: any): Promise<any> => {
  return callHttpFunction("searchContacts", { body: payload });
};
