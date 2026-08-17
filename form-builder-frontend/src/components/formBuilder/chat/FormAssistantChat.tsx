import { useState } from "react";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
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
  displayName: "FormFlow Assistant",
};

const initialConversations = [{ id: CONVERSATION_ID, title: "Form assistant" }];

const FORM_PROMPT_SUGGESTIONS = [
  "Review this form for unclear or missing questions",
  "Make the wording shorter and easier to answer",
  "Suggest a stronger question order",
];

const OVERVIEW_PROMPT_SUGGESTIONS = [
  "Create a customer feedback form",
  "Draft an event registration form",
  "Help me plan the right questions",
];

const partRenderers: ChatPartRendererMap = {
  "data-result": DataResultPart,
};

const AssistantEmptyState = ({ mode }: { mode: "form" | "overview" }) => (
  <Stack
    sx={{
      width: "100%",
      maxWidth: 420,
      mx: "auto",
      px: 2.5,
      py: { xs: 4, sm: 5 },
      textAlign: "left",
    }}
  >
    <Typography
      sx={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        color: "primary.main",
        textTransform: "uppercase",
      }}
    >
      {mode === "overview" ? "Form studio" : "Form copilot"}
    </Typography>
    <Typography component="h3" variant="h2" sx={{ mt: 1 }}>
      {mode === "overview" ? "What should we build?" : "What should we improve?"}
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 1, maxWidth: "38ch" }}>
      {mode === "overview"
        ? "Describe the form you need. The Assistant will prepare a draft for you to review before anything is published."
        : "Ask for a clarity review, a better question order, or a complete draft. Proposed form changes always wait for your approval."}
    </Typography>
  </Stack>
);

const FormEmptyState = () => <AssistantEmptyState mode="form" />;
const OverviewEmptyState = () => <AssistantEmptyState mode="overview" />;

interface FormAssistantChatProps {
  adapter: ChatAdapter;
  /** Storage key used to locate the persisted session for history restore. */
  sessionKey: string;
  mode?: "form" | "overview";
}

/**
 * Chat surface for the form-building assistant. On mount it restores any prior
 * conversation for {@link FormAssistantChatProps.sessionKey} via
 * GET /api/chat/{sessionId}; runtime behaviour comes from the injected adapter.
 */
export default function FormAssistantChat({
  adapter,
  sessionKey,
  mode = "form",
}: FormAssistantChatProps) {
  const [initialSessionId] = useState(() => loadSessionId(sessionKey));

  const { data, isLoading } = useQuery({
    queryKey: ["chat-history", initialSessionId],
    queryFn: () => getChatHistoryApi(initialSessionId as string),
    enabled: !!initialSessionId,
    retry: false,
    staleTime: 0,
  });

  if (initialSessionId && isLoading) {
    return (
      <Stack spacing={1.5} sx={{ height: "100%", p: 2.5 }}>
        <Skeleton variant="rounded" width="72%" height={68} />
        <Skeleton
          variant="rounded"
          width="64%"
          height={58}
          sx={{ alignSelf: "flex-end" }}
        />
        <Skeleton variant="rounded" width="84%" height={92} />
        <Box sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    );
  }

  const restored = data ? mapHistory(data) : [];

  return (
    <ChatBox
      adapter={adapter}
      partRenderers={partRenderers}
      initialConversations={initialConversations}
      initialActiveConversationId={CONVERSATION_ID}
      initialMessages={restored}
      getMessageAuthorDisplayName={(message) =>
        message.role === "assistant" ? ASSISTANT_AUTHOR.displayName : undefined
      }
      suggestions={
        mode === "overview"
          ? OVERVIEW_PROMPT_SUGGESTIONS
          : FORM_PROMPT_SUGGESTIONS
      }
      suggestionsAutoSubmit={false}
      slots={{
        emptyState: mode === "overview" ? OverviewEmptyState : FormEmptyState,
        messageAvatar: null,
        messageAuthorName: null,
      }}
      slotProps={{
        composerRoot: {
          variant: "compact",
        },
        composerInput: {
          rows: 1,
          title: "Enter to send · Shift+Enter for a new line",
        },
        suggestions: {
          "aria-label": "Suggested questions for the form assistant",
        },
      }}
      localeText={{
        composerInputPlaceholder:
          mode === "overview"
            ? "Describe the form you want…"
            : "Ask about this form…",
        composerInputAriaLabel:
          mode === "overview"
            ? "Message the form creation assistant"
            : "Message the form assistant",
        messageReasoningLabel: "Work summary",
        messageReasoningStreamingLabel: "Working through it…",
        responseStreamingStartedAnnouncement:
          "The form assistant started working.",
        responseStreamingCompletedAnnouncement:
          "The form assistant finished its response.",
      }}
      features={{
        attachments: false,
        conversationHeader: false,
        helperText: false,
        streamingIndicator: true,
        autoScroll: { buffer: 120 },
      }}
      sx={{
        height: "100%",
        bgcolor: "#FBFAFF",
        "& .MuiChatBox-root": { height: "100%" },
        "& .MuiChatMessageList-scroller": {
          bgcolor: "#FBFAFF",
          overscrollBehavior: "contain",
        },
        "& .MuiChatMessageList-content": {
          px: { xs: 1.5, sm: 2.25 },
          py: 2.25,
        },
        "& .MuiChatMessage-group": {
          rowGap: 0.75,
        },
        "& .MuiChatMessage-roleAssistant": {
          gridTemplateAreas: '"content" "error" "actions"',
          gridTemplateColumns: "minmax(0, 1fr)",
        },
        "& .MuiChatMessage-bubble": {
          maxWidth: "82%",
          borderRadius: "15px",
          boxShadow: "none",
          fontSize: "0.94rem",
          lineHeight: 1.58,
        },
        "& .MuiChatMessage-roleAssistant .MuiChatMessage-bubble": {
          bgcolor: "background.paper",
          color: "text.primary",
          border: "1px solid",
          borderColor: "divider",
          borderTopLeftRadius: "5px",
          boxShadow: "0 7px 20px rgba(30, 22, 80, 0.07)",
        },
        "& .MuiChatMessage-roleUser .MuiChatMessage-bubble": {
          color: "common.white",
          border: 0,
          borderTopRightRadius: "5px",
          background:
            "linear-gradient(135deg, #6B60FA 0%, #4A3FD8 100%)",
          boxShadow: "0 8px 20px rgba(91, 80, 247, 0.18)",
        },
        "& .MuiChatMessage-bubble details": {
          mt: 0.25,
          mb: 1,
          p: 1.1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "10px",
          bgcolor: "primary.light",
        },
        "& .MuiChatMessage-bubble details > summary": {
          color: "primary.dark",
          fontWeight: 700,
          cursor: "pointer",
        },
        "& .MuiChatMessage-bubble details > div": {
          color: "text.secondary",
        },
        "& .MuiChatStreamingIndicator-root > span": {
          bgcolor: "primary.main",
        },
        "& .MuiChatSuggestions-root": {
          px: { xs: 1.5, sm: 2.25 },
          pb: 1.25,
          gap: 0.75,
          flexWrap: "wrap",
          justifyContent: "center",
          overflow: "visible",
        },
        "& .MuiChatSuggestions-item": {
          minHeight: 40,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "10px",
          bgcolor: "background.paper",
          color: "text.secondary",
          textAlign: "left",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "primary.light",
            color: "primary.dark",
          },
        },
        "& .MuiChatComposer-root": {
          m: { xs: 0.75, sm: 1 },
          mt: 0,
          p: 0.5,
          gap: 0.5,
          minHeight: 46,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          bgcolor: "background.paper",
          boxShadow: "0 7px 20px rgba(30, 22, 80, 0.08)",
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow:
              "0 0 0 3px rgba(91, 80, 247, 0.12), 0 7px 20px rgba(30, 22, 80, 0.08)",
          },
        },
        "& .MuiChatComposer-textArea": {
          height: "auto !important",
          minHeight: 36,
          maxHeight: 104,
          px: 1,
          py: 0.625,
          fieldSizing: "content",
          overflowY: "auto",
          fontFamily: '"DM Sans Variable", sans-serif',
          fontSize: "0.94rem",
          lineHeight: 1.4,
        },
        "& .MuiChatComposer-toolbar": {
          flexShrink: 0,
        },
        "& .MuiChatComposer-sendButton": {
          m: 0,
          width: 36,
          height: 36,
          color: "common.white",
          bgcolor: "primary.main",
          borderRadius: "9px",
          fontSize: "1.1rem",
          "&:hover": { bgcolor: "primary.dark" },
          "&:disabled": {
            color: "text.disabled",
            bgcolor: "primary.light",
          },
        },
      }}
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
