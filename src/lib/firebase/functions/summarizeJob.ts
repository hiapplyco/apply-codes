
import { callHttpFunction } from "./utils";

export const summarizeJob = async (payload: any): Promise<any> => {
  return callHttpFunction("summarizeJob", { body: payload });
};
