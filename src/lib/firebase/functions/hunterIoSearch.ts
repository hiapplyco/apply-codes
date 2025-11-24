
import { callHttpFunction } from "./utils";

export const hunterIoSearch = async (payload: any): Promise<any> => {
  return callHttpFunction("hunterIoSearch", { body: payload });
};
