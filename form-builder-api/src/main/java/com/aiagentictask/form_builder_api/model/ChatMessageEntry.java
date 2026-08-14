package com.aiagentictask.form_builder_api.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single stored turn in a chat session. Only the role and text are kept so
 * the persisted history stays small; tool call traces are intentionally not
 * stored.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageEntry {

  public enum Role {
    USER,
    ASSISTANT
  }

  private Role role;
  private String content;
  private Instant createdAt;
}
