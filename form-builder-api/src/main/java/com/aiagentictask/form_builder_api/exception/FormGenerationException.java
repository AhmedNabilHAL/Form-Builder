package com.aiagentictask.form_builder_api.exception;

/**
 * Raised when the AI form generation flow cannot produce a valid form, either
 * because the model is unavailable/misconfigured or because it failed to return
 * schema-valid JSON within the configured retry budget.
 */
public class FormGenerationException extends RuntimeException {

  public FormGenerationException(String message) {
    super(message);
  }

  public FormGenerationException(String message, Throwable cause) {
    super(message, cause);
  }
}
