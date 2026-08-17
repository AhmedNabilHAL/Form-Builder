import { useCallback, useEffect, useState } from "react";

export const CHAT_MIN_WIDTH = 360;
export const CHAT_DEFAULT_WIDTH = 448;
export const CHAT_MAX_WIDTH = 760;
export const CHAT_WORKSPACE_MIN_WIDTH = 560;
export const CHAT_DOCK_BREAKPOINT = 1024;

const WIDTH_STORAGE_KEY = "form-assistant-panel-width";

/** Clamp a requested width to the allowed range, capped to the viewport. */
export const getChatMaxWidth = (): number => {
  if (typeof window === "undefined") return CHAT_MAX_WIDTH;
  if (window.innerWidth < CHAT_DOCK_BREAKPOINT) return CHAT_MAX_WIDTH;

  return Math.min(
    CHAT_MAX_WIDTH,
    Math.max(
      CHAT_MIN_WIDTH,
      Math.round(window.innerWidth - CHAT_WORKSPACE_MIN_WIDTH)
    )
  );
};

const clampWidth = (value: number): number => {
  const max = getChatMaxWidth();
  return Math.min(Math.max(value, CHAT_MIN_WIDTH), max);
};

const readStoredWidth = (): number => {
  if (typeof window === "undefined") return CHAT_DEFAULT_WIDTH;

  const stored = Number(window.localStorage.getItem(WIDTH_STORAGE_KEY));
  return clampWidth(Number.isFinite(stored) && stored > 0 ? stored : CHAT_DEFAULT_WIDTH);
};

export interface ChatPanelState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Current panel width in pixels. */
  width: number;
  /** Set a new width (clamped and persisted). */
  setWidth: (width: number) => void;
  /** Whether the user is currently dragging the resize handle. */
  isResizing: boolean;
  setResizing: (resizing: boolean) => void;
}

/**
 * Manages the open/closed state, width, and resize state of the form-assistant
 * side dock.
 */
export const useChatPanel = (initialOpen = false): ChatPanelState => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [width, setWidthState] = useState<number>(readStoredWidth);
  const [isResizing, setResizing] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const setWidth = useCallback((next: number) => {
    const clamped = clampWidth(next);
    setWidthState(clamped);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped));
    }
  }, []);

  useEffect(() => {
    const keepWidthInsideViewport = () => {
      setWidthState((current) => clampWidth(current));
    };

    window.addEventListener("resize", keepWidthInsideViewport);
    return () => window.removeEventListener("resize", keepWidthInsideViewport);
  }, []);

  return { isOpen, open, close, toggle, width, setWidth, isResizing, setResizing };
};
