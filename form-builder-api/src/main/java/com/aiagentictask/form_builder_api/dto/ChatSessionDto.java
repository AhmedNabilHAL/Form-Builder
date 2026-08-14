package com.aiagentictask.form_builder_api.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

/**
 * Read model for a chat session's history, returned by
 * {@code GET /api/chat/{sessionId}} so the frontend can restore a conversation.
 */
@Data
public class ChatSessionDto {
  private String id;
  private String title;
  private List<ChatMessageDto> messages = new ArrayList<>();
}
