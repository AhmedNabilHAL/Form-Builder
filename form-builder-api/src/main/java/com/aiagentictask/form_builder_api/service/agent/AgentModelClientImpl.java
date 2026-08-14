package com.aiagentictask.form_builder_api.service.agent;

import java.util.List;

import com.aiagentictask.form_builder_api.configuration.AgentProperties;
import com.aiagentictask.form_builder_api.service.gemini.GeminiClientProvider;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

/**
 * Default {@link AgentModelClient} backed by the shared Gemini client and the
 * agent's tool-enabled generation config.
 */
@Component
public class AgentModelClientImpl implements AgentModelClient {

  private final GeminiClientProvider clientProvider;
  private final GenerateContentConfig agentConfig;
  private final AgentProperties properties;

  public AgentModelClientImpl(GeminiClientProvider clientProvider,
      @Qualifier("agentGenerateContentConfig") GenerateContentConfig agentConfig,
      AgentProperties properties) {
    this.clientProvider = clientProvider;
    this.agentConfig = agentConfig;
    this.properties = properties;
  }

  @Override
  public GenerateContentResponse generate(List<Content> contents) {
    return clientProvider.getClient().models
        .generateContent(properties.getModel(), contents, agentConfig);
  }
}
