package com.aiagentictask.form_builder_api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Persistent chat session for the form assistant. Holds a rolling summary of
 * older turns plus the most recent verbatim messages, so the model can be given
 * useful context without sending the entire history on every request.
 */
@Document(collection = "chat_sessions")
@Data
public class ChatSessionDocument {

  @Id
  private String id;

  /** Short, human-readable label derived from the first user message. */
  private String title;

  /** Compressed summary of older turns; grows/refreshes as history is trimmed. */
  private String summary;

  /**
   * Number of leading messages already folded into {@link #summary}. The full
   * message list is always retained; this pointer only controls how much of the
   * tail is sent to the model as verbatim context.
   */
  private int summarizedMessageCount;

  private List<ChatMessageEntry> messages = new ArrayList<>();

  private Instant createdAt;
  private Instant updatedAt;
}
