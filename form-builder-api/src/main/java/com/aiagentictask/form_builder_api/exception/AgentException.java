package com.aiagentictask.form_builder_api.exception;

/**
 * Raised when the chat agent fails to process a request (model/tool failure).
 * Guardrail refusals and out-of-scope requests are handled as normal MESSAGE
 * replies, not as exceptions.
 */
public class AgentException extends RuntimeException {

  public AgentException(String message) {
    super(message);
  }

  public AgentException(String message, Throwable cause) {
    super(message, cause);
  }
}
