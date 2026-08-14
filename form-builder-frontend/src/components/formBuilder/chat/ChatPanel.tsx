import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { ChatAdapter } from "@mui/x-chat-headless";

import FormAssistantChat from "./FormAssistantChat";

interface ChatPanelProps {
  onClose: () => void;
  /** Clears the conversation and starts a fresh session. */
  onReset: () => void;
  adapter: ChatAdapter;
  /** Storage key used to restore the persisted conversation. */
  sessionKey: string;
}

/**
 * Chat assistant surface rendered inside the layout's resizable dock. Fills the
 * dock's content area; open/close animation and sizing are owned by the dock.
 */
export const ChatPanel = ({ onClose, onReset, adapter, sessionKey }: ChatPanelProps) => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Form Assistant
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Start a new chat">
            <IconButton onClick={onReset} size="small" aria-label="Start a new chat">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose} size="small" aria-label="Close chat">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <FormAssistantChat adapter={adapter} sessionKey={sessionKey} />
      </Box>
    </Box>
  );
};
