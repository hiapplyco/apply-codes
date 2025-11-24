
import { callHttpFunction } from "./utils";

export const analyzeCompensation = async (payload: any): Promise<any> => {
  return callHttpFunction("analyzeCompensation", { body: payload });
};
