import { ChatBox } from "@mui/x-chat";
import type { ChatAdapter, ChatMessage, ChatUser } from "@mui/x-chat-headless";

const CONVERSATION_ID = "form-assistant";

const ASSISTANT_AUTHOR: ChatUser = {
  id: "assistant",
  displayName: "Form Assistant",
  avatarUrl: "/robot.png",
};

const initialConversations = [{ id: CONVERSATION_ID, title: "Let me help you build a form" }];

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    conversationId: CONVERSATION_ID,
    role: "assistant" as const,
    status: "sent" as const,
    author: ASSISTANT_AUTHOR,
    parts: [
      {
        type: "text" as const,
        text: "Hi! Describe the form you want and I'll build it for you.",
      },
    ],
  },
];

interface FormAssistantChatProps {
  adapter: ChatAdapter;
}

/**
 * Chat surface for the form-building assistant. Rendering/config only — all
 * behaviour comes from the injected {@link ChatAdapter}.
 */
export default function FormAssistantChat({ adapter }: FormAssistantChatProps) {
  return (
    <ChatBox
      adapter={adapter}
      initialConversations={initialConversations}
      initialActiveConversationId={CONVERSATION_ID}
      initialMessages={initialMessages}
      getMessageAuthorAvatarUrl={(message) =>
        message.role === "assistant" ? ASSISTANT_AUTHOR.avatarUrl : undefined
      }
      getMessageAuthorDisplayName={(message) =>
        message.role === "assistant" ? ASSISTANT_AUTHOR.displayName : undefined
      }
      sx={{ height: "100%" }}
    />
  );
}

