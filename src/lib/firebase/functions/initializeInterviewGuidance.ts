
import { callHttpFunction } from "./utils";

export const initializeInterviewGuidance = async (): Promise<{ websocket_url: string }> => {
  return callHttpFunction("interviewGuidanceWs");
};
