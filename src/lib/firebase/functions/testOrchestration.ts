
import { callHttpFunction } from "./utils";

export const testOrchestration = async (payload: any): Promise<any> => {
  return callHttpFunction("testOrchestration", { body: payload });
};
