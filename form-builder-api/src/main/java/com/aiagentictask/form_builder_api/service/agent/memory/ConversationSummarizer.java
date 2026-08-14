package com.aiagentictask.form_builder_api.service.agent.memory;

import java.util.List;

import com.aiagentictask.form_builder_api.configuration.AgentProperties;
import com.aiagentictask.form_builder_api.model.ChatMessageEntry;
import com.aiagentictask.form_builder_api.service.gemini.GeminiClientProvider;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.ThinkingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Compresses older chat turns into a short running summary, keeping the context
 * small on subsequent requests. Isolated from the memory bookkeeping (SRP). On
 * any failure it falls back to the existing summary so history trimming never
 * breaks a chat request.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ConversationSummarizer {

  private final GeminiClientProvider clientProvider;
  private final AgentProperties properties;

  /**
   * Returns an updated summary that folds {@code messages} into
   * {@code existingSummary}. Returns the existing summary unchanged if the model
   * produces nothing usable.
   */
  public String summarize(String existingSummary, List<ChatMessageEntry> messages) {
    if (messages == null || messages.isEmpty()) {
      return existingSummary;
    }

    String prompt = buildPrompt(existingSummary, messages);

    GenerateContentConfig config = GenerateContentConfig.builder()
        .temperature(0.2f)
        .maxOutputTokens(properties.getSummaryMaxTokens())
        .thinkingConfig(ThinkingConfig.builder().thinkingBudget(0))
        .candidateCount(1)
        .build();

    try {
      GenerateContentResponse response = clientProvider.getClient().models
          .generateContent(properties.getModel(), prompt, config);
      String text = response.text();
      if (text == null || text.isBlank()) {
        return existingSummary;
      }
      return text.trim();
    } catch (RuntimeException e) {
      log.warn("Conversation summarization failed; keeping the previous summary", e);
      return existingSummary;
    }
  }

  private String buildPrompt(String existingSummary, List<ChatMessageEntry> messages) {
    StringBuilder transcript = new StringBuilder();
    for (ChatMessageEntry message : messages) {
      transcript.append(message.getRole()).append(": ").append(message.getContent()).append('\n');
    }

    return """
        You maintain a running summary of a conversation between a user and a form-building assistant.
        Update the summary to incorporate the new messages below. Keep it concise (a few sentences),
        factual, and focused on: what form/fields the user is building, decisions made, and any
        referenced form ids. Return only the updated summary text, with no preamble.

        Existing summary:
        """
        + (existingSummary == null || existingSummary.isBlank() ? "(none)" : existingSummary)
        + "\n\nNew messages:\n"
        + transcript.toString().stripTrailing();
  }
}
