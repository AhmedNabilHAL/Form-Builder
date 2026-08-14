import type {
  ChatAdapter,
  ChatMessage,
  ChatMessageChunk,
} from "@mui/x-chat-headless";

import type { Form } from "../../../types/Form";
import { sendChatMessageApi } from "../../../api/chat";
import { loadSessionId, saveSessionId } from "./chatSessionStore";

export interface FormChatAdapterOptions {
  /** Snapshot of the form currently open in the builder. */
  getCurrentForm: () => Form;
  /** Called with the generated form so the builder can apply it (FORM replies). */
  onFormGenerated: (form: Form) => void;
  /** Storage key that scopes the persisted chat session (e.g. per form). */
  sessionKey: string;
}

/**
 * A {@link ChatAdapter} backed by the ReAct chat agent (POST /api/chat).
 *
 * It keeps the server-issued session id (persisted per {@link FormChatAdapterOptions.sessionKey})
 * so the whole conversation shares one session and can be restored later. It
 * applies generated forms to the builder on FORM replies and emits a
 * `data-result` part on DATA replies so they render as MUI cards.
 */
export const createFormChatAdapter = ({
  getCurrentForm,
  onFormGenerated,
  sessionKey,
}: FormChatAdapterOptions): ChatAdapter => {
  let sessionId: string | null = loadSessionId(sessionKey);

  return {
    async sendMessage({ message, signal }) {
      const text = extractText(message);

      const response = await sendChatMessageApi({
        sessionId,
        message: text,
        currentForm: getCurrentForm(),
      });

      // Persist the server-issued session id so the conversation can be restored.
      if (response.sessionId && response.sessionId !== sessionId) {
        sessionId = response.sessionId;
        saveSessionId(sessionKey, sessionId);
      }

      if (signal.aborted) {
        return createReplyStream({ text: "" }, signal);
      }

      if (response.type === "FORM" && response.form) {
        onFormGenerated(response.form);
      }

      const data =
        response.type === "DATA" && response.data ? response.data : undefined;

      return createReplyStream({ text: response.message, data }, signal);
    },
  };
};

const extractText = (message: ChatMessage): string =>
  message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

/**
 * Emit a single assistant reply as a readable stream: the text part always, plus
 * an optional `data-result` part rendered as MUI cards.
 */
const createReplyStream = (
  reply: { text: string; data?: unknown },
  signal: AbortSignal
): ReadableStream<ChatMessageChunk> => {
  const messageId = crypto.randomUUID();
  const partId = `${messageId}-text`;

  return new ReadableStream<ChatMessageChunk>({
    start(controller) {
      if (signal.aborted) {
        controller.close();
        return;
      }

      controller.enqueue({ type: "start", messageId });
      controller.enqueue({ type: "text-start", id: partId });
      controller.enqueue({ type: "text-delta", id: partId, delta: reply.text });
      controller.enqueue({ type: "text-end", id: partId });

      if (reply.data) {
        controller.enqueue({
          type: "data-result",
          id: `${messageId}-data`,
          data: reply.data,
        });
      }

      controller.enqueue({ type: "finish", messageId, finishReason: "stop" });
      controller.close();
    },
  });
};
