package com.aiagentictask.form_builder_api.service.gemini;

import java.util.List;

import com.aiagentictask.form_builder_api.dto.FormDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Assembles the prompts sent to Gemini. The initial prompt frames the task and
 * embeds the current form so the model can decide what to keep. The retry
 * prompt
 * adds the model's previous (invalid) output together with the specific
 * validation errors, so each attempt is a targeted correction rather than a
 * blind re-roll. When no prior output exists the builder falls back to the
 * original request.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FormPromptBuilder {

  private static final String INSTRUCTIONS = """
      You are a form-building assistant for a form builder application.
      Convert the user's request into a single form definition.

      Rules:
      - Respond with JSON only. No markdown, comments, or surrounding text.
      - The JSON must match the provided response schema exactly.
      - Allowed element "type" values: "text-input", "select-input", "file-upload".
      - Every "select-input" element must include a non-empty "options" array,
        where each option has a non-empty "value".
      - Do not include "id" or "sortOrder" fields; the server assigns those.
      - Reuse and refine the current form where it already satisfies the request;
        only add, remove, or change elements as needed.
      - Keep titles concise and human readable.
      """;

  private final ObjectMapper objectMapper;

  public String buildInitialPrompt(String userPrompt, FormDto currentForm) {
    return INSTRUCTIONS
        + "\nCurrent form (JSON):\n" + toJson(currentForm)
        + "\n\nUser request:\n" + safe(userPrompt)
        + "\n\nReturn the updated form as JSON.";
  }

  public String buildRetryPrompt(String userPrompt,
      FormDto currentForm,
      String previousInvalidJson,
      List<String> errors) {
    return INSTRUCTIONS
        + "\nCurrent form (JSON):\n" + toJson(currentForm)
        + "\n\nUser request:\n" + safe(userPrompt)
        + "\n\nYour previous response was rejected because of the following problems:\n"
        + formatErrors(errors)
        + "\n\nYour previous response was:\n" + safe(previousInvalidJson)
        + "\n\nFix every problem listed above and return the corrected form as JSON only.";
  }

  private String formatErrors(List<String> errors) {
    if (errors == null || errors.isEmpty()) {
      return "- The response was not valid.";
    }
    StringBuilder sb = new StringBuilder();
    for (String error : errors) {
      sb.append("- ").append(error).append('\n');
    }
    return sb.toString().stripTrailing();
  }

  private String toJson(FormDto form) {
    if (form == null) {
      return "{}";
    }
    try {
      return objectMapper.writeValueAsString(form);
    } catch (JacksonException e) {
      log.warn("Failed to serialize current form for prompt; sending empty object", e);
      return "{}";
    }
  }

  private static String safe(String value) {
    return value == null ? "" : value.trim();
  }
}
