
import { callHttpFunction } from "./utils";

export const processJobRequirementsV2 = async (payload: any): Promise<any> => {
  return callHttpFunction("processJobRequirementsV2", { body: payload });
};
