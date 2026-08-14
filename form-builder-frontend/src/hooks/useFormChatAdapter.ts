import { useMemo } from "react";

import type { ChatAdapter } from "@mui/x-chat-headless";

import {
  createFormChatAdapter,
  type FormChatAdapterOptions,
} from "../components/formBuilder/chat/formChatAdapter";

/**
 * Provides a stable {@link ChatAdapter} for the form-assistant chat.
 *
 * The adapter is memoized on its callbacks, so pass referentially stable
 * functions (e.g. wrapped in `useCallback`) to avoid recreating it each render.
 * Bump {@link resetKey} to force a brand-new adapter (and thus a fresh server
 * session) when starting a new conversation.
 */
export const useFormChatAdapter = ({
  getCurrentForm,
  onFormGenerated,
  sessionKey,
  resetKey = 0,
}: FormChatAdapterOptions & { resetKey?: number }): ChatAdapter =>
  useMemo(
    () => createFormChatAdapter({ getCurrentForm, onFormGenerated, sessionKey }),
    // resetKey intentionally busts the memo so the adapter re-reads the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getCurrentForm, onFormGenerated, sessionKey, resetKey]
  );
