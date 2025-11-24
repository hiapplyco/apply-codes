
import { callHttpFunction } from "./utils";

export const refreshGoogleToken = async (payload: { refreshToken: string }): Promise<any> => {
  return callHttpFunction("refreshGoogleToken", { body: payload });
};
