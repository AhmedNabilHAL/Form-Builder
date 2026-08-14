import { useCallback, useState } from "react";

export const CHAT_MIN_WIDTH = 320;
export const CHAT_DEFAULT_WIDTH = 400;
export const CHAT_MAX_WIDTH = 720;

const WIDTH_STORAGE_KEY = "form-assistant-panel-width";

/** Clamp a requested width to the allowed range, capped to the viewport. */
const clampWidth = (value: number): number => {
  const viewportCap =
    typeof window !== "undefined"
      ? Math.max(CHAT_MIN_WIDTH, Math.round(window.innerWidth * 0.9))
      : CHAT_MAX_WIDTH;

  const max = Math.min(CHAT_MAX_WIDTH, viewportCap);
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

  return { isOpen, open, close, toggle, width, setWidth, isResizing, setResizing };
};
