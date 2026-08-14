const KEY_PREFIX = "formchat:session:";

/** Builds the storage key for a form's chat session (uses "new" for unsaved forms). */
export const sessionKeyForForm = (formId?: string): string => formId?.trim() || "new";

/** Reads the persisted session id for a form's chat, if any. */
export const loadSessionId = (sessionKey: string): string | null => {
  try {
    return window.localStorage.getItem(KEY_PREFIX + sessionKey);
  } catch {
    return null;
  }
};

/** Persists the server-issued session id so the conversation can be restored. */
export const saveSessionId = (sessionKey: string, sessionId: string): void => {
  try {
    window.localStorage.setItem(KEY_PREFIX + sessionKey, sessionId);
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
};

/** Clears a stored session id (e.g. when the server no longer knows it). */
export const clearSessionId = (sessionKey: string): void => {
  try {
    window.localStorage.removeItem(KEY_PREFIX + sessionKey);
  } catch {
    // Ignore storage failures.
  }
};
