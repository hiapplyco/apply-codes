
import { callHttpFunction } from "./utils";

export const getDailyKey = async (): Promise<{ secret: string }> => {
  return callHttpFunction("getDailyKey");
};
