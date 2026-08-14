import { Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ChatBox } from "@mui/x-chat";
import type {
  ChatAdapter,
  ChatMessage,
  ChatPartRendererMap,
  ChatUser,
} from "@mui/x-chat-headless";

import { getChatHistoryApi } from "../../../api/chat";
import type { ChatSessionDto } from "../../../types/Chat";
import { loadSessionId } from "./chatSessionStore";
import { DataResultPart } from "./DataResultPart";

const CONVERSATION_ID = "form-assistant";

const ASSISTANT_AUTHOR: ChatUser = {
  id: "assistant",
  displayName: "Form Assistant",
  avatarUrl: "/robot.png",
};

const initialConversations = [{ id: CONVERSATION_ID, title: "Let me help you build a form" }];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  conversationId: CONVERSATION_ID,
  role: "assistant",
  status: "sent",
  author: ASSISTANT_AUTHOR,
  parts: [
    {
      type: "text",
      text:
        "Hi! I can build or refine forms, tell you what forms exist and what " +
        "they ask about, report on submitted answers, and suggest ideas. What " +
        "would you like to do?",
    },
  ],
};

// Render DATA replies (the `data-result` part) as MUI cards.
const partRenderers: ChatPartRendererMap = {
  "data-result": DataResultPart,
};

interface FormAssistantChatProps {
  adapter: ChatAdapter;
  /** Storage key used to locate the persisted session for history restore. */
  sessionKey: string;
}

/**
 * Chat surface for the form-building assistant. On mount it restores any prior
 * conversation for {@link FormAssistantChatProps.sessionKey} via
 * GET /api/chat/{sessionId}; runtime behaviour comes from the injected adapter.
 */
export default function FormAssistantChat({ adapter, sessionKey }: FormAssistantChatProps) {
  const sessionId = loadSessionId(sessionKey);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-history", sessionId],
    queryFn: () => getChatHistoryApi(sessionId as string),
    enabled: !!sessionId,
    retry: false,
    staleTime: 0,
  });

  if (sessionId && isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  const restored = data ? mapHistory(data) : [];
  const initialMessages = restored.length > 0 ? restored : [WELCOME_MESSAGE];

  return (
    <ChatBox
      adapter={adapter}
      partRenderers={partRenderers}
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

const mapHistory = (session: ChatSessionDto): ChatMessage[] =>
  session.messages.map((message, index) => ({
    id: `${session.id}-${index}`,
    conversationId: CONVERSATION_ID,
    role: message.role === "assistant" ? "assistant" : "user",
    status: "sent",
    author: message.role === "assistant" ? ASSISTANT_AUTHOR : undefined,
    parts: [{ type: "text", text: message.content }],
  }));

