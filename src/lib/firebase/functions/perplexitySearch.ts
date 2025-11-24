
import { callHttpFunction } from "./utils";

export const perplexitySearch = async (payload: any): Promise<any> => {
  return callHttpFunction("perplexitySearch", { body: payload });
};
