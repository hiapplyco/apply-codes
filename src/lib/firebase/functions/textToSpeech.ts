
import { callHttpFunction } from "./utils";

export const textToSpeech = async (payload: any): Promise<any> => {
  return callHttpFunction("textToSpeech", { body: payload });
};
