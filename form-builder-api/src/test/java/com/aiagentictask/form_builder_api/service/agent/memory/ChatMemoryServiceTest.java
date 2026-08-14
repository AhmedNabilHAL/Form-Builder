package com.aiagentictask.form_builder_api.service.agent.memory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.aiagentictask.form_builder_api.configuration.AgentProperties;
import com.aiagentictask.form_builder_api.model.ChatMessageEntry;
import com.aiagentictask.form_builder_api.model.ChatSessionDocument;
import com.aiagentictask.form_builder_api.repository.ChatSessionRepository;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.google.genai.types.Content;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ChatMemoryServiceTest {

  private ChatSessionRepository repository;
  private ConversationSummarizer summarizer;
  private AgentProperties properties;
  private ChatMemoryService service;

  @BeforeEach
  void setUp() {
    repository = mock(ChatSessionRepository.class);
    summarizer = mock(ConversationSummarizer.class);
    properties = new AgentProperties();
    when(repository.save(any(ChatSessionDocument.class))).thenAnswer(inv -> inv.getArgument(0));
    service = new ChatMemoryService(repository, summarizer, properties);
  }

  @Test
  void loadOrCreateCreatesNewSessionWhenIdMissing() {
    ChatSessionDocument session = service.loadOrCreate(null);

    assertNotNull(session.getId());
    assertNotNull(session.getCreatedAt());
    verify(repository).save(session);
  }

  @Test
  void loadOrCreateThrowsWhenIdNotFound() {
    when(repository.findById("missing")).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> service.loadOrCreate("missing"));
  }

  @Test
  void buildContentsIncludesSummaryUnsummarizedTailAndVerbatimCurrentMessage() {
    ChatSessionDocument session = new ChatSessionDocument();
    session.setSummary("Earlier the user built a survey.");
    session.getMessages().add(entry(ChatMessageEntry.Role.USER, "add a name field"));
    session.getMessages().add(entry(ChatMessageEntry.Role.ASSISTANT, "added name"));
    session.getMessages().add(entry(ChatMessageEntry.Role.USER, "add an email field"));
    session.getMessages().add(entry(ChatMessageEntry.Role.ASSISTANT, "added email"));
    // First two messages already folded into the summary.
    session.setSummarizedMessageCount(2);

    List<Content> contents = service.buildContents(session, "now add a phone field");

    // summary (1) + un-summarized tail (2) + current (1) = 4
    assertEquals(4, contents.size());
    assertEquals("now add a phone field", lastText(contents));
    assertTrue(firstText(contents).contains("survey"), "summary should be prepended for context");
  }

  @Test
  void recordTurnAppendsMessagesAndSetsTitleWithoutSummarizingSmallHistory() {
    ChatSessionDocument session = new ChatSessionDocument();
    session.setId("s1");

    service.recordTurn(session, "Build a contact form please", "Sure, done.");

    assertEquals(2, session.getMessages().size());
    assertEquals(ChatMessageEntry.Role.USER, session.getMessages().get(0).getRole());
    assertEquals("Build a contact form please", session.getTitle());
    verify(summarizer, never()).summarize(any(), anyList());
    verify(repository).save(session);
  }

  @Test
  void recordTurnSummarizesWithoutLosingHistoryWhenThresholdExceeded() {
    properties.setHistoryCharThreshold(10);
    properties.setRecentMessagesToKeep(2);
    when(summarizer.summarize(any(), anyList())).thenReturn("compressed summary");

    ChatSessionDocument session = new ChatSessionDocument();
    session.setId("s1");
    for (int i = 0; i < 4; i++) {
      session.getMessages().add(entry(ChatMessageEntry.Role.USER, "message number " + i));
    }

    service.recordTurn(session, "another long message here", "an assistant reply that is long");

    verify(summarizer).summarize(any(), anyList());
    assertEquals("compressed summary", session.getSummary());
    // 4 seed + 2 appended = 6 retained; none dropped.
    assertEquals(6, session.getMessages().size(), "full history is retained");
    // keep the most recent 2 verbatim; the rest are summarized.
    assertEquals(4, session.getSummarizedMessageCount());
  }

  @Test
  void getHistoryMapsMessages() {
    ChatSessionDocument session = new ChatSessionDocument();
    session.setId("s1");
    session.setTitle("My chat");
    session.getMessages().add(entry(ChatMessageEntry.Role.USER, "hello"));
    when(repository.findById("s1")).thenReturn(Optional.of(session));

    var dto = service.getHistory("s1");

    assertEquals("s1", dto.getId());
    assertEquals("My chat", dto.getTitle());
    assertEquals(1, dto.getMessages().size());
    assertEquals("user", dto.getMessages().get(0).getRole());
    assertEquals("hello", dto.getMessages().get(0).getContent());
  }

  private static ChatMessageEntry entry(ChatMessageEntry.Role role, String content) {
    return new ChatMessageEntry(role, content, Instant.now());
  }

  private static String firstText(List<Content> contents) {
    return contents.get(0).parts().get().get(0).text().get();
  }

  private static String lastText(List<Content> contents) {
    return contents.get(contents.size() - 1).parts().get().get(0).text().get();
  }
}
