package com.aiagentictask.form_builder_api.service.agent;

import com.aiagentictask.form_builder_api.dto.FormDto;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Per-request context passed to tools during a single agent turn. Transient;
 * never persisted.
 */
@Getter
@RequiredArgsConstructor
public class AgentContext {

  private final String sessionId;

  /**
   * The form currently open in the builder (may be null); used to refine on
   * generate.
   */
  private final FormDto currentForm;
}
