
import { callHttpFunction } from "./utils";

export const getContactInfo = async (payload: any): Promise<any> => {
  return callHttpFunction("getContactInfo", { body: payload });
};
