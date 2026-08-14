import { Box, Fab, Zoom } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

interface ChatToggleButtonProps {
  onClick: () => void;
  hidden?: boolean;
}

export const ChatToggleButton = ({ onClick, hidden }: ChatToggleButtonProps) => {
  return (
    <Zoom in={!hidden} unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          bottom: 104,
          right: 32,
          zIndex: 9999,
        }}
      >
        <Fab color="secondary" onClick={onClick} aria-label="Open form assistant">
          <ChatBubbleOutlineIcon />
        </Fab>
      </Box>
    </Zoom>
  );
};
