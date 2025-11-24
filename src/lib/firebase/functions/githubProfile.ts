
import { callHttpFunction } from "./utils";

export const githubProfile = async (payload: any): Promise<any> => {
  return callHttpFunction("githubProfile", { body: payload });
};
