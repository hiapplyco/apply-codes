
import { callHttpFunction } from "./utils";

export const generateInterviewQuestions = async (payload: any): Promise<any> => {
  return callHttpFunction("generateInterviewQuestions", { body: payload });
};
