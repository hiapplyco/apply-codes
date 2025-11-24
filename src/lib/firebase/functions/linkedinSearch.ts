
import { callHttpFunction } from "./utils";

export const linkedinSearch = async (payload: any): Promise<any> => {
  return callHttpFunction("linkedinSearch", { body: payload });
};
