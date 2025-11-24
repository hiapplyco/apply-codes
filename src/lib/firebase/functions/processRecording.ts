
import { callHttpFunction } from "./utils";

export const processRecording = async (payload: any): Promise<any> => {
  return callHttpFunction("processRecording", { body: payload });
};
