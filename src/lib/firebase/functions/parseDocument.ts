
import { callHttpFunction } from "./utils";

export const parseDocument = async (formData: FormData): Promise<any> => {
  return callHttpFunction("parseDocument", { body: formData, isFormData: true });
};
