package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.Map;

import com.aiagentictask.form_builder_api.service.agent.AgentContext;
import com.google.genai.types.FunctionDeclaration;

/**
 * A capability the agent can invoke via Gemini function calling.
 * Implementations
 * are Spring beans, so they can depend on services/repositories. Each tool owns
 * its Gemini {@link FunctionDeclaration} and its execution logic (SRP).
 */
public interface AgentTool {

  /** Unique function name exposed to the model (a-z, 0-9, underscores). */
  String name();

  /**
   * The declaration (name, description, parameter schema) advertised to the
   * model.
   */
  FunctionDeclaration declaration();

  /**
   * Executes the tool with the model-supplied arguments and per-request context.
   */
  ToolResult execute(Map<String, Object> args, AgentContext context);
}
