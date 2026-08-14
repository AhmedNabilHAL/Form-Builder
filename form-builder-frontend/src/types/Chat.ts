import type { Form } from "./Form";

/** Discriminator for the unified chat response envelope from POST /api/chat. */
export type ResponseType = "MESSAGE" | "DATA" | "FORM";

/** Summary shape returned by the list_forms tool (type = DATA, data.kind = "forms"). */
export interface FormSummary {
  id: string;
  title: string;
  description?: string | null;
  fieldCount: number;
}

/** Unified response from the chat agent. */
export interface AgentResponse {
  sessionId: string;
  type: ResponseType;
  message: string;
  /** Structured payload for DATA replies (e.g. forms list / submissions report). */
  data?: unknown;
  /** Generated form for FORM replies. */
  form?: Form | null;
}

/** Request body for POST /api/chat. Omit sessionId on the first message. */
export interface ChatRequestPayload {
  sessionId?: string | null;
  message: string;
  currentForm?: Form | null;
}

/** One stored turn from GET /api/chat/{sessionId}. */
export interface ChatMessageDto {
  role: "user" | "assistant";
  content: string;
  createdAt?: string | null;
}

/** Conversation history from GET /api/chat/{sessionId}. */
export interface ChatSessionDto {
  id: string;
  title?: string | null;
  messages: ChatMessageDto[];
}

/** Compact submission row surfaced by the get_form_submissions tool. */
export interface SubmissionRow {
  submissionId: string;
  submittedAt?: string | null;
  answers: Record<string, string>;
}

/** Structured payload carried by DATA replies (rendered as MUI cards). */
export type DataResult =
  | { kind: "forms"; forms: FormSummary[] }
  | { kind: "submissions"; formId: string; count: number; submissions: SubmissionRow[] };

