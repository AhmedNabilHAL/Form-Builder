package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.google.genai.types.Tool;
import org.springframework.stereotype.Component;

/**
 * Collects all {@link AgentTool} beans, exposes them as a single Gemini
 * {@link Tool}, and resolves a tool by the name the model calls.
 */
@Component
public class ToolRegistry {

  private final Map<String, AgentTool> toolsByName;
  private final Tool geminiTool;

  public ToolRegistry(List<AgentTool> tools) {
    this.toolsByName = tools.stream()
        .collect(Collectors.toMap(AgentTool::name, Function.identity()));
    this.geminiTool = Tool.builder()
        .functionDeclarations(tools.stream().map(AgentTool::declaration).toList())
        .build();
  }

  /** The combined tool advertised to the model. */
  public Tool geminiTool() {
    return geminiTool;
  }

  public Optional<AgentTool> find(String name) {
    return Optional.ofNullable(toolsByName.get(name));
  }
}
