
import { callHttpFunction } from "./utils";

export const explainBoolean = async (payload: any): Promise<any> => {
  return callHttpFunction("explainBoolean", { body: payload });
};
