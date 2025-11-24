
import { callHttpFunction } from "./utils";

export const revokeGoogleToken = async (payload: { accessToken: string }): Promise<any> => {
  return callHttpFunction("revokeGoogleToken", { body: payload });
};
