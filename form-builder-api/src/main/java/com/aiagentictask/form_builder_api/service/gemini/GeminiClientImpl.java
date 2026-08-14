package com.aiagentictask.form_builder_api.service.gemini;

import com.aiagentictask.form_builder_api.configuration.GeminiProperties;
import com.aiagentictask.form_builder_api.exception.FormGenerationException;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiClientImpl implements GeminiClient {

  private final GeminiClientProvider clientProvider;
  private final GenerateContentConfig generateContentConfig;
  private final GeminiProperties properties;

  @Override
  public String generateJson(String prompt) {
    try {
      GenerateContentResponse response = clientProvider.getClient().models.generateContent(properties.getModel(),
          prompt, generateContentConfig);
      String text = response.text();
      if (text == null || text.isBlank()) {
        throw new FormGenerationException("Gemini returned an empty response.");
      }
      return text;
    } catch (FormGenerationException e) {
      throw e;
    } catch (RuntimeException e) {
      log.error("Gemini request failed", e);
      throw new FormGenerationException("Gemini request failed: " + e.getMessage(), e);
    }
  }
}
