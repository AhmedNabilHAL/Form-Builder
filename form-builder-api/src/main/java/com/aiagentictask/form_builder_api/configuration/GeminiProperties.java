package com.aiagentictask.form_builder_api.configuration;

import java.util.List;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.gemini.*} properties used by the form generation feature.
 * Secrets (the API key) are supplied via environment variables only.
 */
@ConfigurationProperties(prefix = "app.gemini")
@Data
public class GeminiProperties {

  /**
   * Gemini API key. Sourced from the GEMINI_API_KEY env variable; required at
   * startup.
   */
  private String apiKey;

  private String model = "gemini-2.5-flash";

  private Float temperature = 0.2f;

  private Integer maxOutputTokens = 2048;

  /** 0 disables model "thinking" to conserve free-tier tokens. */
  private Integer thinkingBudget = 0;

  private Integer timeoutMs = 30000;

  private final Retry retry = new Retry();

  @Data
  public static class Retry {
    /**
     * Attempts for the validation-feedback loop (kept low to protect the free
     * tier).
     */
    private int maxAttempts = 2;

    /** Attempts for transient HTTP errors, handled by the SDK. */
    private int httpAttempts = 2;

    /** HTTP status codes that trigger an SDK-level retry. */
    private List<Integer> httpStatusCodes = List.of(408, 429, 500, 503);
  }
}
