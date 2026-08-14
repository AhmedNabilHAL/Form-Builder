package com.aiagentictask.form_builder_api.configuration;

import com.aiagentictask.form_builder_api.service.agent.tools.ToolRegistry;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import com.google.genai.types.ThinkingConfig;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the chat agent's Gemini configuration. Unlike the form-generation
 * config
 * (which pins JSON output to the form schema), this config enables tools and
 * free-text responses so the model can reason, call tools, and reply
 * conversationally. The system instruction is the primary guardrail keeping the
 * assistant on-topic.
 */
@Configuration
@EnableConfigurationProperties(AgentProperties.class)
public class AgentConfig {

  static final String SYSTEM_INSTRUCTION = """
      You are the assistant for a form-builder application. You help users understand and build forms.

      Scope (strict):
      - Only help with this form-builder system: existing forms, their fields, the submissions/answers
        stored for them, ideas for form content, and creating or editing forms.
      - If a request is outside this scope (general knowledge, coding help, chit-chat unrelated to
        forms, etc.), politely decline in one sentence and steer the user back to forms. Do not answer
        out-of-scope questions.

      Tools:
      - Use list_forms to see what forms exist or answer "what forms are there / what are they about".
      - Use get_form_details to explain what a specific form asks about (you need its id from list_forms).
      - Use get_form_submissions to report on the answers/data collected for a form.
      - Use generate_form only when the user actually wants to create or change a form.
      - For plain ideas or suggestions about form content, just answer in text without a tool.

      Style:
      - Base factual answers about forms and submissions on tool results, not guesses.
      - Keep replies concise and friendly. After generating a form, briefly say what you built.
      """;

  @Bean
  public GenerateContentConfig agentGenerateContentConfig(AgentProperties properties,
      ToolRegistry toolRegistry) {
    return GenerateContentConfig.builder()
        .systemInstruction(Content.fromParts(Part.fromText(SYSTEM_INSTRUCTION)))
        .tools(toolRegistry.geminiTool())
        .temperature(properties.getTemperature())
        .maxOutputTokens(properties.getMaxOutputTokens())
        .thinkingConfig(ThinkingConfig.builder().thinkingBudget(properties.getThinkingBudget()))
        .candidateCount(1)
        .build();
  }
}
