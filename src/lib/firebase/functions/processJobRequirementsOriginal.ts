
import { callHttpFunction } from "./utils";

export const processJobRequirementsOriginal = async (payload: any): Promise<any> => {
  return callHttpFunction("processJobRequirementsOriginal", { body: payload });
};
