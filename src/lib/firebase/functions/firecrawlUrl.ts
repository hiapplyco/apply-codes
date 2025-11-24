
import { callHttpFunction } from "./utils";

export const firecrawlUrl = async (payload: any): Promise<any> => {
  return callHttpFunction("firecrawlUrl", { body: payload });
};
