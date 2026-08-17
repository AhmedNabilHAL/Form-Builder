import {
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box } from "@mui/material";

import {
  CHAT_DEFAULT_WIDTH,
  CHAT_MAX_WIDTH,
  CHAT_MIN_WIDTH,
  getChatMaxWidth,
} from "../../hooks/useChatPanel";

interface ChatDockProps {
  open: boolean;
  width: number;
  isResizing: boolean;
  onWidthChange: (width: number) => void;
  onResizingChange: (resizing: boolean) => void;
  /** Callback ref used to expose the dock's inner content area for portals. */
  registerPortalNode: (node: HTMLElement | null) => void;
}

const HANDLE_WIDTH = 14;

/**
 * Right-docked, full-height chat frame. Owns the drag-to-resize interaction and
 * exposes an inner content area (via {@link ChatDockProps.registerPortalNode})
 * that pages fill with a portal. Width animates on open/close, but the
 * transition is suppressed while dragging so resizing tracks the pointer.
 */
export const ChatDock = ({
  open,
  width,
  isResizing,
  onWidthChange,
  onResizingChange,
  registerPortalNode,
}: ChatDockProps) => {
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.focus();
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onResizingChange(true);
    },
    [onResizingChange]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isResizing) return;
      onWidthChange(window.innerWidth - event.clientX);
    },
    [isResizing, onWidthChange]
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      onResizingChange(false);
    },
    [onResizingChange]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 64 : 24;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onWidthChange(width + step);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onWidthChange(width - step);
      } else if (event.key === "Home") {
        event.preventDefault();
        onWidthChange(CHAT_MIN_WIDTH);
      } else if (event.key === "End") {
        event.preventDefault();
        onWidthChange(CHAT_MAX_WIDTH);
      }
    },
    [onWidthChange, width]
  );

  return (
    <Box
      component="aside"
      id="form-assistant-panel"
      aria-hidden={!open}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: open ? { xs: "100%", lg: width } : 0,
        overflow: "hidden",
        display: "flex",
        pointerEvents: open ? "auto" : "none",
        zIndex: (theme) => theme.zIndex.appBar + 2,
        bgcolor: "background.paper",
        borderLeft: open ? "1px solid" : "none",
        borderColor: "divider",
        boxShadow: open ? "-18px 0 48px rgba(30, 22, 80, 0.18)" : "none",
        transition: isResizing ? "none" : "width 240ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <Box
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize assistant panel"
        aria-valuemin={CHAT_MIN_WIDTH}
        aria-valuemax={getChatMaxWidth()}
        aria-valuenow={Math.round(width)}
        tabIndex={open ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={() => onResizingChange(false)}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => onWidthChange(CHAT_DEFAULT_WIDTH)}
        sx={{
          flexShrink: 0,
          width: `${HANDLE_WIDTH}px`,
          cursor: "col-resize",
          display: { xs: "none", lg: "grid" },
          placeItems: "center",
          bgcolor: isResizing ? "primary.light" : "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          transition: "background-color 150ms ease",
          "&::after": {
            content: '""',
            width: 3,
            height: 56,
            borderRadius: 999,
            bgcolor: isResizing ? "primary.main" : "divider",
            boxShadow: isResizing
              ? "0 0 0 4px rgba(91,80,247,0.10)"
              : "none",
            transition: "background-color 150ms ease, box-shadow 150ms ease",
          },
          "&:hover": {
            bgcolor: "primary.light",
            "&::after": { bgcolor: "primary.main" },
          },
          "&:focus-visible": {
            outline: "3px solid",
            outlineColor: "primary.main",
            outlineOffset: -3,
            "&::after": { bgcolor: "primary.main" },
          },
          touchAction: "none",
        }}
      />

      <Box
        ref={registerPortalNode}
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overscrollBehavior: "contain",
        }}
      />
    </Box>
  );
};
