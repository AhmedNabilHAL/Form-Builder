import { useOutletContext } from "react-router-dom";

/**
 * Shared handle to the right-side chat dock owned by {@link AppLayout} and
 * exposed to routed pages through the router's `Outlet` context.
 */
export interface ChatDockContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Current dock width in pixels. */
  width: number;
  /**
   * Portal target that lives inside the dock frame. `null` until the dock has
   * mounted; pages should render their chat content into it with a portal.
   */
  portalNode: HTMLElement | null;
}

/** Access the chat dock exposed by {@link AppLayout} from a routed page. */
export const useChatDock = (): ChatDockContextValue =>
  useOutletContext<ChatDockContextValue>();
