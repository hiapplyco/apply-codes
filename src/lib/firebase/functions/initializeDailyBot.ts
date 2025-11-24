
import { callHttpFunction } from "./utils";

export const initializeDailyBot = async (): Promise<{ websocket_url: string }> => {
  return callHttpFunction("initializeDailyBot");
};
