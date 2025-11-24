
import { callHttpFunction } from "./utils";

export const processKickoffCall = async (payload: any): Promise<any> => {
  return callHttpFunction("processKickoffCall", { body: payload });
};
