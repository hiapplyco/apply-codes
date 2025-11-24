
import { callHttpFunction } from "./utils";

export const summarizeTitle = async (payload: any): Promise<any> => {
  return callHttpFunction("summarizeTitle", { body: payload });
};
