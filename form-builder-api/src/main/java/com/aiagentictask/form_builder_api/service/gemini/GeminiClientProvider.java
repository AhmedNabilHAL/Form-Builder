package com.aiagentictask.form_builder_api.service.gemini;

import com.google.genai.Client;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Supplies the Gemini {@link Client} to collaborators. This indirection gives a
 * single place to add cross-cutting logic (metrics, per-request selection,
 * header injection, etc.) before the client is handed out, without changing
 * callers.
 */
@Component
@RequiredArgsConstructor
public class GeminiClientProvider {

  private final Client client;

  public Client getClient() {
    return client;
  }
}
