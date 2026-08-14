package com.aiagentictask.form_builder_api.configuration;

import com.aiagentictask.form_builder_api.service.gemini.FormResponseSchema;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.google.genai.types.ThinkingConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Wires the Gemini integration. The SDK client is created eagerly at startup so
 * a missing/invalid API key fails fast rather than surfacing on the first
 * generate request. The generation config is fixed for the form-building use
 * case, so it is built once and reused across requests.
 */
@Configuration
@EnableConfigurationProperties(GeminiProperties.class)
@Slf4j
public class GeminiConfig {

  @Bean
  public Client geminiClient(GeminiProperties properties) {
    String apiKey = properties.getApiKey();
    if (apiKey == null || apiKey.isBlank()) {
      throw new IllegalStateException(
          "Gemini API key is missing. Set the GEMINI_API_KEY environment variable (app.gemini.api-key).");
    }

    HttpRetryOptions retryOptions = HttpRetryOptions.builder()
        .attempts(properties.getRetry().getHttpAttempts())
        .httpStatusCodes(properties.getRetry().getHttpStatusCodes())
        .build();

    HttpOptions httpOptions = HttpOptions.builder()
        .timeout(properties.getTimeoutMs())
        .retryOptions(retryOptions)
        .build();

    Client client = Client.builder()
        .apiKey(apiKey)
        .httpOptions(httpOptions)
        .build();

    log.info("Initialized Gemini client (model={})", properties.getModel());
    return client;
  }

  /**
   * The request configuration pins output to the Form JSON schema and disables
   * model "thinking" to conserve free-tier tokens. It is immutable and thread
   * safe, so a single instance is shared across all generate calls. Marked
   * primary so it remains the default {@link GenerateContentConfig} injected by
   * the form-generation client, alongside the agent's own config bean.
   */
  @Bean
  @Primary
  public GenerateContentConfig geminiGenerateContentConfig(GeminiProperties properties,
      FormResponseSchema formResponseSchema) {
    return GenerateContentConfig.builder()
        .responseMimeType("application/json")
        .responseSchema(formResponseSchema.schema())
        .temperature(properties.getTemperature())
        .maxOutputTokens(properties.getMaxOutputTokens())
        .thinkingConfig(ThinkingConfig.builder().thinkingBudget(properties.getThinkingBudget()))
        .candidateCount(1)
        .build();
  }
}
