import type {
  ChatAdapter,
  ChatMessage,
  ChatMessageChunk,
} from "@mui/x-chat-headless";

import type { AgentResponse } from "../../../types/Chat";
import type { Form } from "../../../types/Form";
import { sendChatMessageApi } from "../../../api/chat";
import { loadSessionId, saveSessionId } from "./chatSessionStore";

export interface FormChatAdapterOptions {
  /** Snapshot of the form currently open in the builder. */
  getCurrentForm: () => Form;
  /** Called with a generated draft so the builder can preview it before applying. */
  onFormProposed: (form: Form) => void;
  /** Storage key that scopes the persisted chat session (e.g. per form). */
  sessionKey: string;
}

const WORK_SUMMARY_STAGES = [
  "Reading your request and the current form.",
  "Checking structure, wording, and response flow.",
  "Preparing a clear answer or proposed changes.",
];

/**
 * A {@link ChatAdapter} backed by the ReAct chat agent (POST /api/chat).
 *
 * It keeps the server-issued session id so the conversation can be restored,
 * emits a concise work summary while the request is in flight, and streams the
 * returned text in readable chunks.
 */
export const createFormChatAdapter = ({
  getCurrentForm,
  onFormProposed,
  sessionKey,
}: FormChatAdapterOptions): ChatAdapter => {
  let sessionId: string | null = loadSessionId(sessionKey);

  return {
    async sendMessage({ message, signal }) {
      const text = extractText(message);
      const currentForm = getCurrentForm();

      return createReplyStream({
        signal,
        request: () =>
          sendChatMessageApi(
            {
              sessionId,
              message: text,
              currentForm,
            },
            signal
          ),
        onResponse: (response) => {
          if (response.sessionId && response.sessionId !== sessionId) {
            sessionId = response.sessionId;
            saveSessionId(sessionKey, sessionId);
          }

          if (response.type === "FORM" && response.form) {
            onFormProposed(response.form);
          }
        },
      });
    },
  };
};

const extractText = (message: ChatMessage): string =>
  message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

interface ReplyStreamOptions {
  signal: AbortSignal;
  request: () => Promise<AgentResponse>;
  onResponse: (response: AgentResponse) => void;
}

const createReplyStream = ({
  signal,
  request,
  onResponse,
}: ReplyStreamOptions): ReadableStream<ChatMessageChunk> => {
  const messageId = crypto.randomUUID();
  const reasoningId = `${messageId}-work`;
  const textId = `${messageId}-text`;
  let controllerRef: ReadableStreamDefaultController<ChatMessageChunk> | null =
    null;
  let closed = false;
  const progressTimers: Array<ReturnType<typeof setTimeout>> = [];

  const cleanup = () => {
    progressTimers.forEach((timer) => clearTimeout(timer));
    progressTimers.length = 0;
    signal.removeEventListener("abort", handleAbort);
  };

  const safeEnqueue = (chunk: ChatMessageChunk) => {
    if (closed || signal.aborted || !controllerRef) return;
    controllerRef.enqueue(chunk);
  };

  const close = () => {
    if (closed) return;
    closed = true;
    cleanup();
    try {
      controllerRef?.close();
    } catch {
      // The runtime may already have closed the stream after cancellation.
    }
    controllerRef = null;
  };

  const handleAbort = () => {
    if (closed) return;
    if (controllerRef) {
      try {
        controllerRef.enqueue({ type: "abort", messageId });
      } catch {
        // Ignore an enqueue racing with a stream cancellation.
      }
    }
    close();
  };

  const fail = (error: unknown) => {
    if (closed) return;
    closed = true;
    cleanup();
    controllerRef?.error(error);
    controllerRef = null;
  };

  return new ReadableStream<ChatMessageChunk>({
    start(controller) {
      controllerRef = controller;

      if (signal.aborted) {
        close();
        return;
      }

      signal.addEventListener("abort", handleAbort, { once: true });
      safeEnqueue({ type: "start", messageId });
      safeEnqueue({ type: "reasoning-start", id: reasoningId });
      safeEnqueue({
        type: "reasoning-delta",
        id: reasoningId,
        delta: WORK_SUMMARY_STAGES[0],
      });

      WORK_SUMMARY_STAGES.slice(1).forEach((stage, index) => {
        progressTimers.push(
          setTimeout(
            () =>
              safeEnqueue({
                type: "reasoning-delta",
                id: reasoningId,
                delta: `\n${stage}`,
              }),
            850 + index * 1_250
          )
        );
      });

      void (async () => {
        try {
          const response = await request();
          if (signal.aborted || closed) return;

          onResponse(response);
          progressTimers.forEach((timer) => clearTimeout(timer));
          progressTimers.length = 0;

          safeEnqueue({ type: "reasoning-end", id: reasoningId });
          safeEnqueue({ type: "text-start", id: textId });

          const chunks = chunkResponse(response.message);
          const delayMs = response.message.length > 1_200 ? 12 : 22;

          for (const chunk of chunks) {
            if (signal.aborted || closed) return;
            safeEnqueue({ type: "text-delta", id: textId, delta: chunk });
            await wait(delayMs);
          }

          safeEnqueue({ type: "text-end", id: textId });

          if (response.type === "DATA" && response.data) {
            safeEnqueue({
              type: "data-result",
              id: `${messageId}-data`,
              data: response.data,
            });
          }

          safeEnqueue({ type: "finish", messageId, finishReason: "stop" });
          close();
        } catch (error) {
          if (signal.aborted) {
            handleAbort();
            return;
          }
          fail(error);
        }
      })();
    },
    cancel() {
      close();
    },
  });
};

const chunkResponse = (text: string): string[] => {
  const words = text.match(/\S+\s*/g) ?? [];
  if (words.length === 0) return [text];

  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += 4) {
    chunks.push(words.slice(index, index + 4).join(""));
  }
  return chunks;
};

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
