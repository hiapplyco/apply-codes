
import { callHttpFunction } from "./utils";

export const shareGoogleDoc = async (payload: any): Promise<any> => {
  return callHttpFunction("shareGoogleDoc", { body: payload });
};
