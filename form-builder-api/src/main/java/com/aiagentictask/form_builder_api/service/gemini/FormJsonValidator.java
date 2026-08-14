package com.aiagentictask.form_builder_api.service.gemini;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.FormElementDto;
import com.aiagentictask.form_builder_api.dto.SelectInputElementDto;
import com.aiagentictask.form_builder_api.dto.SelectOptionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Validates that a raw JSON string produced by the model can be deserialized
 * into a {@link FormDto} and satisfies the structural rules the frontend relies
 * on. Errors are accumulated (rather than failing fast) so the retry loop can
 * feed precise, actionable feedback back to the model.
 */
@Component
@RequiredArgsConstructor
public class FormJsonValidator {

  private static final Set<String> ALLOWED_TYPES = Set.of("text-input", "select-input", "file-upload");

  private final ObjectMapper objectMapper;

  public ValidationResult validate(String json) {
    FormDto form;
    try {
      form = objectMapper.readValue(json, FormDto.class);
    } catch (JacksonException e) {
      return ValidationResult.invalid(List.of(
          "Response is not valid JSON matching the Form schema: " + e.getMessage()));
    }

    List<String> errors = new ArrayList<>();

    if (isBlank(form.getTitle())) {
      errors.add("Form 'title' is required and must not be blank.");
    }

    List<FormElementDto> elements = form.getElements();
    if (elements == null || elements.isEmpty()) {
      errors.add("Form must contain at least one item in 'elements'.");
    } else {
      for (int i = 0; i < elements.size(); i++) {
        validateElement(elements.get(i), "elements[" + i + "]", errors);
      }
    }

    return errors.isEmpty() ? ValidationResult.valid(form) : ValidationResult.invalid(errors);
  }

  private void validateElement(FormElementDto element, String where, List<String> errors) {
    if (element == null) {
      errors.add(where + " is null.");
      return;
    }
    if (isBlank(element.getTitle())) {
      errors.add(where + ".title is required and must not be blank.");
    }
    String type = element.getType();
    if (type == null || !ALLOWED_TYPES.contains(type)) {
      errors.add(where + ".type must be one of " + ALLOWED_TYPES + " but was '" + type + "'.");
    }
    if (element instanceof SelectInputElementDto select) {
      List<SelectOptionDto> options = select.getOptions();
      if (options == null || options.isEmpty()) {
        errors.add(where + " is a 'select-input' and must have at least one option.");
      } else {
        for (int j = 0; j < options.size(); j++) {
          SelectOptionDto option = options.get(j);
          if (option == null || isBlank(option.getValue())) {
            errors.add(where + ".options[" + j + "].value is required and must not be blank.");
          }
        }
      }
    }
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  /**
   * Outcome of a validation pass. Holds the parsed form when valid, or the
   * collected errors otherwise.
   */
  public record ValidationResult(boolean valid, FormDto form, List<String> errors) {

    public static ValidationResult valid(FormDto form) {
      return new ValidationResult(true, form, List.of());
    }

    public static ValidationResult invalid(List<String> errors) {
      return new ValidationResult(false, null, List.copyOf(errors));
    }
  }
}
