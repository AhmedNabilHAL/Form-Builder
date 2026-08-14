import type { Form } from "../types/Form";
import { request } from "./form";

/**
 * Payload sent to the form-generation backend.
 * The current form is included so the model can decide which parts to keep.
 */
export type GenerateFormRequest = {
  prompt: string;
  currentForm: Form;
};

/**
 * Generate a form from a prompt.
 *
 * Backend: POST /api/forms/generate
 * Returns valid JSON representing {@link Form} data.
 */
export const generateFormFromPromptApi = async (
  payload: GenerateFormRequest
): Promise<Form> => {
  return request<Form>("/forms/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
