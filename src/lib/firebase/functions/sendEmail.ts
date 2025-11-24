
import { callHttpFunction } from "./utils";

export const sendEmail = async (payload: any): Promise<any> => {
  return callHttpFunction("sendEmail", { body: payload });
};
