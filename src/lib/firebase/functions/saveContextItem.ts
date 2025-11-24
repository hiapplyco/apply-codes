
import { callHttpFunction } from "./utils";

export const saveContextItem = async (payload: any): Promise<any> => {
  return callHttpFunction("saveContextItem", { body: payload });
};
