import { Box, IconButton, Paper, Slide, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ChatAdapter } from "@mui/x-chat-headless";

import FormAssistantChat from "./FormAssistantChat";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  adapter: ChatAdapter;
}

const PANEL_WIDTH = 400;

/**
 * Persistent slide-in side panel hosting the form assistant.
 */
export const ChatPanel = ({ open, onClose, adapter }: ChatPanelProps) => {
  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        square
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: { xs: "100%", sm: PANEL_WIDTH },
          zIndex: (theme) => theme.zIndex.appBar + 2,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
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

          <IconButton onClick={onClose} size="small" aria-label="Close chat">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <FormAssistantChat adapter={adapter} />
        </Box>
      </Paper>
    </Slide>
  );
};
