
import { callHttpFunction } from "./utils";

export const generateDashboardMetrics = async (payload: any): Promise<any> => {
  return callHttpFunction("generateDashboardMetrics", { body: payload });
};
