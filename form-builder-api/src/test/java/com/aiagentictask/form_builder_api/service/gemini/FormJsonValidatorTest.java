package com.aiagentictask.form_builder_api.service.gemini;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class FormJsonValidatorTest {

  private final FormJsonValidator validator = new FormJsonValidator(new ObjectMapper());

  @Test
  void acceptsWellFormedForm() {
    String json = """
        {
          "title": "Contact us",
          "description": "Reach out",
          "elements": [
            { "type": "text-input", "title": "Full name", "required": true },
            { "type": "select-input", "title": "Topic", "required": false,
              "options": [ { "value": "Sales" }, { "value": "Support" } ] }
          ]
        }
        """;

    FormJsonValidator.ValidationResult result = validator.validate(json);

    assertTrue(result.valid(), () -> "expected valid but got errors: " + result.errors());
  }

  @Test
  void rejectsBlankTitleAndEmptyElements() {
    String json = """
        { "title": "", "elements": [] }
        """;

    FormJsonValidator.ValidationResult result = validator.validate(json);

    assertFalse(result.valid());
    assertTrue(result.errors().stream().anyMatch(e -> e.contains("title")));
    assertTrue(result.errors().stream().anyMatch(e -> e.contains("at least one item")));
  }

  @Test
  void rejectsSelectInputWithoutOptions() {
    String json = """
        {
          "title": "Survey",
          "elements": [
            { "type": "select-input", "title": "Choice", "required": true, "options": [] }
          ]
        }
        """;

    FormJsonValidator.ValidationResult result = validator.validate(json);

    assertFalse(result.valid());
    assertTrue(result.errors().stream().anyMatch(e -> e.contains("at least one option")));
  }

  @Test
  void rejectsNonJsonResponse() {
    FormJsonValidator.ValidationResult result = validator.validate("not json");

    assertFalse(result.valid());
    assertFalse(result.errors().isEmpty());
  }
}
