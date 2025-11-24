
import { callHttpFunction } from "./utils";

export const generateLinkedinPost = async (payload: any): Promise<any> => {
  return callHttpFunction("createLinkedinPost", { body: payload });
};
