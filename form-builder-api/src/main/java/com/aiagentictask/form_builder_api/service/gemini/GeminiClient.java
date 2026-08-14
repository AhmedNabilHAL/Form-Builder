package com.aiagentictask.form_builder_api.service.gemini;

public interface GeminiClient {

  /**
   * Sends {@code prompt} to Gemini using the shared, form-scoped generation
   * config and returns the raw JSON text of the model's response.
   */
  String generateJson(String prompt);
}
