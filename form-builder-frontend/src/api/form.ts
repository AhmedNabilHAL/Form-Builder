import type { Form } from "../types/Form";
import type { Submission, SubmissionValue } from "../types/Submission";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

type ApiErrorResponse = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
};

export type PublishFormResponse = {
  success: boolean;
  formId?: string;
  message?: string;
};

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorBody = (await response.json()) as ApiErrorResponse;
    return errorBody.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

/**
 * Create/publish a new form
 * Backend: POST /api/forms
 */
export const publishFormApi = async (
  form: Form
): Promise<PublishFormResponse> => {
  const createdForm = await request<Form>("/forms", {
    method: "POST",
    body: JSON.stringify(form),
  });

  return {
    success: true,
    formId: createdForm.id,
    message: "Form published successfully",
  };
};

/**
 * Get all forms
 * Backend: GET /api/forms
 */
export const getFormsApi = async (): Promise<Form[]> => {
  return request<Form[]>("/forms", {
    method: "GET",
  });
};

/**
 * Get one form by id
 * Backend: GET /api/forms/:id
 */
export const getFormByIdApi = async (formId: string): Promise<Form> => {
  return request<Form>(`/forms/${formId}`, {
    method: "GET",
  });
};

/**
 * Update an existing form
 * Backend: PUT /api/forms/:id
 */
export const updateFormApi = async (formId: string, form: Form): Promise<Form> => {
  return request<Form>(`/forms/${formId}`, {
    method: "PUT",
    body: JSON.stringify(form),
  });
};

/**
 * Delete a form
 * Backend: DELETE /api/forms/:id
 */
export const deleteFormApi = async (formId: string): Promise<void> => {
  return request<void>(`/forms/${formId}`, {
    method: "DELETE",
  });
};

/**
 * Submit answers to a form
 * Backend: POST /api/forms/:formId/submissions
 */
export const createSubmissionApi = async (payload: {
  formId: string;
  answers: Record<string, SubmissionValue>;
}): Promise<Submission> => {
  const formData = new FormData();

  const serializableAnswers: Record<string, string | null> = {};

  for (const [fieldId, value] of Object.entries(payload.answers)) {
    if (value instanceof File) {
      formData.append(fieldId, value);
      serializableAnswers[fieldId] = null;
    } else if (typeof value === "string") {
      serializableAnswers[fieldId] = value;
    } else {
      serializableAnswers[fieldId] = null;
    }
  }

  formData.append("answers", JSON.stringify(serializableAnswers));

  const response = await fetch(
    buildUrl(`/forms/${payload.formId}/submissions`),
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as Submission;
};

/**
 * Get all submissions for a form
 * Backend: GET /api/forms/:formId/submissions
 */
export const getSubmissionsByFormIdApi = async (
  formId: string
): Promise<Submission[]> => {
  return request<Submission[]>(`/forms/${formId}/submissions`, {
    method: "GET",
  });
};

/**
 * Get one submission by id
 * Backend: GET /api/forms/:formId/submissions/:submissionId
 */
export const getSubmissionByIdApi = async (
  formId: string,
  submissionId: string
): Promise<Submission> => {
  return request<Submission>(`/forms/${formId}/submissions/${submissionId}`, {
    method: "GET",
  });
};