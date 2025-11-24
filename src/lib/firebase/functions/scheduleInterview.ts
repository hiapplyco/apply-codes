
import { callHttpFunction } from "./utils";

export const scheduleInterview = async (payload: any): Promise<any> => {
  return callHttpFunction("scheduleInterview", { body: payload });
};
