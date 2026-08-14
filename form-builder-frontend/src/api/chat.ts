import type { Form } from "../types/Form";
import type {
  AgentResponse,
  ChatRequestPayload,
  ChatSessionDto,
} from "../types/Chat";
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

/**
 * Send a message to the ReAct chat agent.
 *
 * Backend: POST /api/chat
 * On the first message omit `sessionId`; reuse the `sessionId` returned in the
 * response for the rest of the conversation. The reply is a unified envelope
 * whose `type` is MESSAGE, DATA, or FORM.
 */
export const sendChatMessageApi = async (
  payload: ChatRequestPayload
): Promise<AgentResponse> => {
  return request<AgentResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Fetch a conversation's history to restore it in the UI.
 *
 * Backend: GET /api/chat/{sessionId}
 */
export const getChatHistoryApi = async (
  sessionId: string
): Promise<ChatSessionDto> => {
  return request<ChatSessionDto>(`/chat/${encodeURIComponent(sessionId)}`);
};

