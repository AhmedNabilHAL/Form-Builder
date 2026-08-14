package com.aiagentictask.form_builder_api.service;

import java.util.List;
import java.util.UUID;

import com.aiagentictask.form_builder_api.configuration.GeminiProperties;
import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.FormElementDto;
import com.aiagentictask.form_builder_api.dto.SelectInputElementDto;
import com.aiagentictask.form_builder_api.dto.SelectOptionDto;
import com.aiagentictask.form_builder_api.exception.FormGenerationException;
import com.aiagentictask.form_builder_api.service.gemini.FormJsonValidator;
import com.aiagentictask.form_builder_api.service.gemini.FormPromptBuilder;
import com.aiagentictask.form_builder_api.service.gemini.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Orchestrates AI form generation: build prompt, call Gemini, validate the
 * output, and retry with targeted feedback when validation fails. The retry
 * budget is small by default (see {@code app.gemini.retry.max-attempts}) to
 * limit token usage. Valid forms are enriched with server-assigned ids and
 * sort order before being returned; the form is not persisted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FormGenerationService {

  private final GeminiClient geminiClient;
  private final FormPromptBuilder promptBuilder;
  private final FormJsonValidator validator;
  private final GeminiProperties properties;

  public FormDto generate(String userPrompt, FormDto currentForm) {
    int maxAttempts = Math.max(1, properties.getRetry().getMaxAttempts());

    List<String> lastErrors = null;
    String lastJson = null;

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      String prompt = (lastJson == null)
          ? promptBuilder.buildInitialPrompt(userPrompt, currentForm)
          : promptBuilder.buildRetryPrompt(userPrompt, currentForm, lastJson, lastErrors);

      log.info("Form generation attempt {}/{}", attempt, maxAttempts);
      String json = geminiClient.generateJson(prompt);

      FormJsonValidator.ValidationResult result = validator.validate(json);
      if (result.valid()) {
        return enrich(result.form(), currentForm);
      }

      lastJson = json;
      lastErrors = result.errors();
      log.warn("Attempt {} produced an invalid form: {}", attempt, lastErrors);
    }

    throw new FormGenerationException(
        "Unable to generate a valid form after " + maxAttempts + " attempts. Last errors: " + lastErrors);
  }

  /**
   * Assigns the id of the form being edited and fills in any missing element
   * and option ids and sort order, so the returned form is directly usable by
   * the frontend.
   */
  private FormDto enrich(FormDto form, FormDto currentForm) {
    form.setId(currentForm == null ? null : currentForm.getId());

    List<FormElementDto> elements = form.getElements();
    for (int i = 0; i < elements.size(); i++) {
      FormElementDto element = elements.get(i);
      if (isBlank(element.getId())) {
        element.setId(UUID.randomUUID().toString());
      }
      if (element.getSortOrder() == null) {
        element.setSortOrder(i);
      }
      if (element instanceof SelectInputElementDto select) {
        for (SelectOptionDto option : select.getOptions()) {
          if (isBlank(option.getId())) {
            option.setId(UUID.randomUUID().toString());
          }
        }
      }
    }
    return form;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
