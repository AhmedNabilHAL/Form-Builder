package com.aiagentictask.form_builder_api.dto;

/**
 * Discriminator for the unified chat response envelope. Tells the frontend how
 * to render the assistant's reply.
 */
public enum ResponseType {
  /** Plain conversational text. */
  MESSAGE,
  /**
   * Text plus a structured data payload (e.g. a forms list or submissions
   * report).
   */
  DATA,
  /** Text plus a generated form to render/populate. */
  FORM
}
