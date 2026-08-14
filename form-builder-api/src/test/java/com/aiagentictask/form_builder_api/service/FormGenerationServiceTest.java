package com.aiagentictask.form_builder_api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

import com.aiagentictask.form_builder_api.configuration.GeminiProperties;
import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.SelectInputElementDto;
import com.aiagentictask.form_builder_api.exception.FormGenerationException;
import com.aiagentictask.form_builder_api.service.gemini.FormJsonValidator;
import com.aiagentictask.form_builder_api.service.gemini.FormPromptBuilder;
import com.aiagentictask.form_builder_api.service.gemini.GeminiClient;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class FormGenerationServiceTest {

  private static final String VALID_FORM = """
      {
        "title": "Contact us",
        "elements": [
          { "type": "text-input", "title": "Full name", "required": true },
          { "type": "select-input", "title": "Topic", "required": false,
            "options": [ { "value": "Sales" } ] }
        ]
      }
      """;

  private static final String INVALID_FORM = """
      { "title": "", "elements": [] }
      """;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private FormGenerationService service(GeminiClient client) {
    return new FormGenerationService(
        client,
        new FormPromptBuilder(objectMapper),
        new FormJsonValidator(objectMapper),
        new GeminiProperties());
  }

  @Test
  void retriesOnceThenSucceeds() {
    QueuedClient client = new QueuedClient(INVALID_FORM, VALID_FORM);
    FormDto current = new FormDto();
    current.setId("form-123");

    FormDto result = service(client).generate("build a contact form", current);

    assertEquals(2, client.callCount, "should have retried exactly once");
    assertEquals("form-123", result.getId(), "current form id must be preserved");
    assertEquals("Contact us", result.getTitle());
    assertEquals(2, result.getElements().size());
    result.getElements().forEach(el -> assertNotNull(el.getId(), "server should assign element ids"));
    result.getElements().forEach(el -> assertNotNull(el.getSortOrder(), "server should assign sort order"));

    SelectInputElementDto select = (SelectInputElementDto) result.getElements().get(1);
    select.getOptions().forEach(opt -> assertNotNull(opt.getId(), "server should assign option ids"));
  }

  @Test
  void throwsAfterExhaustingAttempts() {
    QueuedClient client = new QueuedClient(INVALID_FORM, INVALID_FORM);

    FormGenerationException ex = assertThrows(FormGenerationException.class,
        () -> service(client).generate("build a form", new FormDto()));

    assertEquals(2, client.callCount, "should stop at the configured max attempts");
    assertTrue(ex.getMessage().contains("after 2 attempts"));
  }

  @Test
  void secondPromptContainsErrorFeedback() {
    RecordingClient client = new RecordingClient(INVALID_FORM, VALID_FORM);

    service(client).generate("build a form", new FormDto());

    assertEquals(2, client.prompts.size());
    String retryPrompt = client.prompts.get(1);
    assertTrue(retryPrompt.contains("previous response was rejected"),
        "retry prompt should include feedback about the failure");
    assertFalse(client.prompts.get(0).contains("previous response was rejected"),
        "initial prompt should not include failure feedback");
  }

  /** Returns queued responses in order; counts calls. */
  private static final class QueuedClient implements GeminiClient {
    private final Deque<String> responses = new ArrayDeque<>();
    private int callCount;

    QueuedClient(String... responses) {
      for (String r : responses) {
        this.responses.add(r);
      }
    }

    @Override
    public String generateJson(String prompt) {
      callCount++;
      return responses.poll();
    }
  }

  /** Like QueuedClient but also records the prompts it received. */
  private static final class RecordingClient implements GeminiClient {
    private final Deque<String> responses = new ArrayDeque<>();
    private final List<String> prompts = new java.util.ArrayList<>();

    RecordingClient(String... responses) {
      for (String r : responses) {
        this.responses.add(r);
      }
    }

    @Override
    public String generateJson(String prompt) {
      prompts.add(prompt);
      return responses.poll();
    }
  }
}
