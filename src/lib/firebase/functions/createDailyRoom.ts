
import { callHttpFunction } from "./utils";

export const createDailyRoom = async (payload: any = {}): Promise<any> => {
  return callHttpFunction("createDailyRoom", { body: payload });
};
