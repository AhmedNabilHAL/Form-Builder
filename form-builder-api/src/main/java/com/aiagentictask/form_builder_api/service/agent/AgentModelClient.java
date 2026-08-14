package com.aiagentictask.form_builder_api.service.agent;

import java.util.List;

import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;

/**
 * Seam over the raw Gemini generate-content call used by the agent loop.
 * Keeping
 * it behind an interface (as with the form-generation client) lets the ReAct
 * orchestration be unit tested without the live SDK.
 */
public interface AgentModelClient {

  GenerateContentResponse generate(List<Content> contents);
}
