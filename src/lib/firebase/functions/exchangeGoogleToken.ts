
import { callHttpFunction } from "./utils";

export const exchangeGoogleToken = async (payload: { code: string; redirectUri: string }): Promise<any> => {
  return callHttpFunction("exchangeGoogleToken", { body: payload });
};
