import { useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { Box } from "@mui/material";

interface ChatDockProps {
  open: boolean;
  width: number;
  isResizing: boolean;
  onWidthChange: (width: number) => void;
  onResizingChange: (resizing: boolean) => void;
  /** Callback ref used to expose the dock's inner content area for portals. */
  registerPortalNode: (node: HTMLElement | null) => void;
}

const HANDLE_WIDTH = 6;

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

  return (
    <Box
      component="aside"
      aria-hidden={!open}
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: open ? { xs: "100%", sm: width } : 0,
        overflow: "hidden",
        display: "flex",
        zIndex: (theme) => theme.zIndex.appBar + 2,
        bgcolor: "background.paper",
        borderLeft: open ? "1px solid" : "none",
        borderColor: "divider",
        boxShadow: open ? "-12px 0 32px rgba(32,33,36,0.12)" : "none",
        transition: isResizing ? "none" : "width 225ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Box
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        sx={{
          flexShrink: 0,
          width: `${HANDLE_WIDTH}px`,
          cursor: "col-resize",
          bgcolor: isResizing ? "primary.main" : "transparent",
          transition: "background-color 150ms ease",
          "&:hover": { bgcolor: "primary.light" },
          display: { xs: "none", sm: "block" },
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
        }}
      />
    </Box>
  );
};
