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
 */
export const useFormChatAdapter = ({
  getCurrentForm,
  onFormGenerated,
}: FormChatAdapterOptions): ChatAdapter =>
  useMemo(
    () => createFormChatAdapter({ getCurrentForm, onFormGenerated }),
    [getCurrentForm, onFormGenerated]
  );
