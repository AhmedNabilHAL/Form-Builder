package com.aiagentictask.form_builder_api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Unified chat response envelope. {@code type} tells the frontend which of the
 * three actions this reply represents; {@code message} is always present as
 * human-readable text. {@code data} is populated for {@link ResponseType#DATA}
 * and {@code form} for {@link ResponseType#FORM}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentResponse {

  private String sessionId;
  private ResponseType type;
  private String message;

  /**
   * Structured payload for DATA replies (e.g. forms list, submissions report);
   * otherwise null.
   */
  private Object data;

  /** Generated form for FORM replies; otherwise null. */
  private FormDto form;
}
