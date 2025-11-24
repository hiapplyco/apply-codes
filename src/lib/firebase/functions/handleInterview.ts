
import { callHttpFunction } from "./utils";

export const handleInterview = async (payload: any): Promise<any> => {
  return callHttpFunction("handleInterview", { body: payload });
};
