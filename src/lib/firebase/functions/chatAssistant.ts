
import { callHttpFunction } from "./utils";

export const chatAssistant = async (payload: any): Promise<any> => {
  return callHttpFunction("chatAssistant", { body: payload });
};
