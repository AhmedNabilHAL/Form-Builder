package com.aiagentictask.form_builder_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for {@code POST /api/chat}. On the first message
 * {@code sessionId}
 * is null and the server creates a session, returning its id in the response.
 * The optional {@code currentForm} lets the agent refine the form currently
 * being edited in the builder.
 */
@Data
public class ChatRequest {

  /**
   * Null/blank on the first message; reuse the value returned by the server
   * afterwards.
   */
  private String sessionId;

  @NotBlank
  @Size(max = 4000)
  private String message;

  private FormDto currentForm;
}
