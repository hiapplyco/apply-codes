
import { callHttpFunction } from "./utils";

export const getDriveFolders = async (payload: any): Promise<any> => {
  return callHttpFunction("getDriveFolders", { body: payload });
};
