import type {
  ChatAdapter,
  ChatMessage,
  ChatMessageChunk,
} from "@mui/x-chat-headless";

import type { Form } from "../../../types/Form";
import { generateFormFromPromptApi } from "../../../api/chat";

export interface FormChatAdapterOptions {
  /** Snapshot of the form currently open in the builder. */
  getCurrentForm: () => Form;
  /** Called with the generated form so the builder can apply it. */
  onFormGenerated: (form: Form) => void;
}

/**
 * A {@link ChatAdapter} that turns the user's message into a generated form.
*/
export const createFormChatAdapter = ({
  getCurrentForm,
  onFormGenerated,
}: FormChatAdapterOptions): ChatAdapter => ({
  async sendMessage({ message, signal }) {
    const prompt = extractText(message);

    const form = await generateFormFromPromptApi({
      prompt,
      currentForm: getCurrentForm(),
    });

    if (signal.aborted) {
      return createTextReplyStream("", signal);
    }

    onFormGenerated(form);

    return createTextReplyStream(buildReply(form), signal);
  },
});

const extractText = (message: ChatMessage): string =>
  message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

const buildReply = (form: Form): string => {
  const fieldCount = form.elements.length;
  const fieldWord = fieldCount === 1 ? "field" : "fields";

  return (
    `Done! I created "${form.title}" with ${fieldCount} ${fieldWord} and ` +
    `applied it to the builder. Refine your request and I'll update it.`
  );
};

/**
 * Emit a single assistant reply as a readable stream, mirroring the chunk
 * sequence used by the library's built-in adapters.
 */
const createTextReplyStream = (
  text: string,
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
      controller.enqueue({ type: "text-delta", id: partId, delta: text });
      controller.enqueue({ type: "text-end", id: partId });
      controller.enqueue({
        type: "finish",
        messageId,
        finishReason: "stop",
      });
      controller.close();
    },
  });
};
