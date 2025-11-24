
import { callHttpFunction } from "./utils";

export const enhanceJobDescription = async (payload: any): Promise<any> => {
  return callHttpFunction("enhanceJobDescription", { body: payload });
};
