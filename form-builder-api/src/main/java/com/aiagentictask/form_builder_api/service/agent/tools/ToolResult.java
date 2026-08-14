package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.Map;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.ResponseType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Outcome of a tool execution. {@code modelResponse} is the compact payload fed
 * back to the model as a function response; {@code type} and
 * {@code clientArtifact} feed the unified {@code AgentResponse} envelope shown
 * to the frontend.
 */
@Getter
@RequiredArgsConstructor
public class ToolResult {

  private final Map<String, Object> modelResponse;
  private final ResponseType type;
  private final Object clientArtifact;

  /** Data reply: structured artifact rendered by the frontend. */
  public static ToolResult data(Map<String, Object> modelResponse, Object artifact) {
    return new ToolResult(modelResponse, ResponseType.DATA, artifact);
  }

  /** Form reply: a generated form to render/populate. */
  public static ToolResult form(Map<String, Object> modelResponse, FormDto form) {
    return new ToolResult(modelResponse, ResponseType.FORM, form);
  }

  /** Plain message reply: no artifact, the model phrases the final answer. */
  public static ToolResult message(Map<String, Object> modelResponse) {
    return new ToolResult(modelResponse, ResponseType.MESSAGE, null);
  }
}
