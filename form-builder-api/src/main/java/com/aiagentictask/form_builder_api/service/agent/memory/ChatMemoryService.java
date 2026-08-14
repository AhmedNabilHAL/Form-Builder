package com.aiagentictask.form_builder_api.service.agent.memory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.aiagentictask.form_builder_api.configuration.AgentProperties;
import com.aiagentictask.form_builder_api.dto.ChatMessageDto;
import com.aiagentictask.form_builder_api.dto.ChatSessionDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.model.ChatMessageEntry;
import com.aiagentictask.form_builder_api.model.ChatSessionDocument;
import com.aiagentictask.form_builder_api.repository.ChatSessionRepository;
import com.google.genai.types.Content;
import com.google.genai.types.Part;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Owns chat-session persistence and context assembly. Builds the model input as
 * a rolling summary plus the most recent verbatim turns, and always appends the
 * current message unchanged. The full message history is always retained for
 * the
 * client; when the un-summarized tail grows past the configured character
 * threshold, older turns are folded into the summary and the summarized pointer
 * advances — no stored messages are removed.
 */
@Service
@RequiredArgsConstructor
public class ChatMemoryService {

  private static final String USER_ROLE = "user";
  private static final String MODEL_ROLE = "model";
  private static final int TITLE_MAX_LENGTH = 60;

  private final ChatSessionRepository repository;
  private final ConversationSummarizer summarizer;
  private final AgentProperties properties;

  /**
   * Returns the session for {@code sessionId}, creating a new one (with a
   * server-generated id) when the id is null/blank. A non-blank id that does not
   * exist is treated as a missing resource.
   */
  public ChatSessionDocument loadOrCreate(String sessionId) {
    if (sessionId == null || sessionId.isBlank()) {
      ChatSessionDocument session = new ChatSessionDocument();
      session.setId(UUID.randomUUID().toString());
      session.setCreatedAt(Instant.now());
      session.setUpdatedAt(Instant.now());
      return repository.save(session);
    }

    return repository.findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Chat session not found with id: " + sessionId));
  }

  /**
   * Builds the model contents: summary preamble + un-summarized recent turns +
   * current message (verbatim).
   */
  public List<Content> buildContents(ChatSessionDocument session, String currentMessage) {
    List<Content> contents = new ArrayList<>();

    String summary = session.getSummary();
    if (summary != null && !summary.isBlank()) {
      contents.add(textContent(USER_ROLE,
          "Conversation summary so far (for context):\n" + summary));
    }

    for (ChatMessageEntry message : unsummarizedTail(session)) {
      String role = message.getRole() == ChatMessageEntry.Role.USER ? USER_ROLE : MODEL_ROLE;
      contents.add(textContent(role, message.getContent()));
    }

    contents.add(textContent(USER_ROLE, currentMessage));
    return contents;
  }

  /**
   * Appends the user + assistant turn, refreshes metadata, and summarizes if
   * needed.
   */
  public void recordTurn(ChatSessionDocument session, String userMessage, String assistantMessage) {
    Instant now = Instant.now();
    session.getMessages().add(new ChatMessageEntry(ChatMessageEntry.Role.USER, userMessage, now));
    session.getMessages().add(new ChatMessageEntry(ChatMessageEntry.Role.ASSISTANT, assistantMessage, now));
    session.setUpdatedAt(now);

    if (session.getTitle() == null || session.getTitle().isBlank()) {
      session.setTitle(deriveTitle(userMessage));
    }

    summarizeIfNeeded(session);
    repository.save(session);
  }

  /** History read model for the frontend. */
  public ChatSessionDto getHistory(String sessionId) {
    ChatSessionDocument session = repository.findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Chat session not found with id: " + sessionId));

    ChatSessionDto dto = new ChatSessionDto();
    dto.setId(session.getId());
    dto.setTitle(session.getTitle());
    dto.setMessages(session.getMessages().stream()
        .map(message -> new ChatMessageDto(
            message.getRole().name().toLowerCase(),
            message.getContent(),
            message.getCreatedAt() == null ? null : message.getCreatedAt().toString()))
        .toList());
    return dto;
  }

  private void summarizeIfNeeded(ChatSessionDocument session) {
    if (contextChars(session) <= properties.getHistoryCharThreshold()) {
      return;
    }

    int keep = properties.getRecentMessagesToKeep();
    List<ChatMessageEntry> messages = session.getMessages();
    int from = Math.min(session.getSummarizedMessageCount(), messages.size());
    int foldUntil = messages.size() - keep;
    if (foldUntil <= from) {
      return; // nothing new to summarize beyond the recent window
    }

    List<ChatMessageEntry> toFold = new ArrayList<>(messages.subList(from, foldUntil));
    // Full history is retained; only the summary and the pointer advance.
    session.setSummary(summarizer.summarize(session.getSummary(), toFold));
    session.setSummarizedMessageCount(foldUntil);
  }

  private List<ChatMessageEntry> unsummarizedTail(ChatSessionDocument session) {
    List<ChatMessageEntry> all = session.getMessages();
    int from = Math.min(session.getSummarizedMessageCount(), all.size());
    return all.subList(from, all.size());
  }

  private int contextChars(ChatSessionDocument session) {
    int total = session.getSummary() == null ? 0 : session.getSummary().length();
    for (ChatMessageEntry message : unsummarizedTail(session)) {
      if (message.getContent() != null) {
        total += message.getContent().length();
      }
    }
    return total;
  }

  private String deriveTitle(String userMessage) {
    String trimmed = userMessage.strip();
    if (trimmed.length() <= TITLE_MAX_LENGTH) {
      return trimmed;
    }
    return trimmed.substring(0, TITLE_MAX_LENGTH).strip() + "…";
  }

  private Content textContent(String role, String text) {
    return Content.builder().role(role).parts(List.of(Part.fromText(text))).build();
  }
}
