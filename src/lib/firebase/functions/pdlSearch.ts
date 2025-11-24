
import { callHttpFunction } from "./utils";

export const pdlSearch = async (payload: any): Promise<any> => {
  return callHttpFunction("pdlSearch", { body: payload });
};
