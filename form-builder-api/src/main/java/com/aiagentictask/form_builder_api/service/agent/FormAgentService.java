package com.aiagentictask.form_builder_api.service.agent;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.aiagentictask.form_builder_api.configuration.AgentProperties;
import com.aiagentictask.form_builder_api.dto.AgentResponse;
import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.ResponseType;
import com.aiagentictask.form_builder_api.exception.AgentException;
import com.aiagentictask.form_builder_api.model.ChatSessionDocument;
import com.aiagentictask.form_builder_api.service.agent.memory.ChatMemoryService;
import com.aiagentictask.form_builder_api.service.agent.tools.AgentTool;
import com.aiagentictask.form_builder_api.service.agent.tools.ToolRegistry;
import com.aiagentictask.form_builder_api.service.agent.tools.ToolResult;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionCall;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ReAct-style chat agent built on Gemini function calling. Each turn: load the
 * session, assemble bounded context, then loop reason -&gt; (tool) act -&gt;
 * observe until the model returns a final text answer or the iteration cap is
 * reached. The reply is classified into the unified {@link AgentResponse}
 * envelope, and the turn is persisted for future context.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FormAgentService {

  private final AgentModelClient modelClient;
  private final AgentProperties properties;
  private final ToolRegistry toolRegistry;
  private final ChatMemoryService memoryService;

  public AgentResponse chat(String sessionId, String message, FormDto currentForm) {
    ChatSessionDocument session = memoryService.loadOrCreate(sessionId);
    AgentContext context = new AgentContext(session.getId(), currentForm);

    List<Content> contents = new ArrayList<>(memoryService.buildContents(session, message));

    TurnOutcome outcome = runReactLoop(contents, context);

    String finalText = (outcome.text == null || outcome.text.isBlank())
        ? defaultMessage(outcome.type)
        : outcome.text.strip();

    memoryService.recordTurn(session, message, finalText);

    return AgentResponse.builder()
        .sessionId(session.getId())
        .type(outcome.type)
        .message(finalText)
        .data(outcome.data)
        .form(outcome.form)
        .build();
  }

  private TurnOutcome runReactLoop(List<Content> contents, AgentContext context) {
    TurnOutcome outcome = new TurnOutcome();
    int maxIterations = Math.max(1, properties.getMaxToolIterations());

    try {
      for (int iteration = 0; iteration < maxIterations; iteration++) {
        GenerateContentResponse response = modelClient.generate(contents);

        List<FunctionCall> calls = response.functionCalls();
        if (calls == null || calls.isEmpty()) {
          outcome.text = response.text();
          return outcome;
        }

        // Echo the model's tool-calling turn, then answer each call.
        contents.add(Content.builder().role("model").parts(response.parts()).build());

        List<Part> responseParts = new ArrayList<>();
        for (FunctionCall call : calls) {
          String name = call.name().orElse("");
          Map<String, Object> args = call.args().orElse(Map.of());

          AgentTool tool = toolRegistry.find(name)
              .orElseThrow(() -> new AgentException("Model requested an unknown tool: " + name));

          ToolResult result = tool.execute(args, context);
          applyArtifact(outcome, result);
          responseParts.add(Part.fromFunctionResponse(name, result.getModelResponse()));
        }

        contents.add(Content.builder().role("user").parts(responseParts).build());
      }
    } catch (AgentException e) {
      throw e;
    } catch (RuntimeException e) {
      log.error("Agent chat failed", e);
      throw new AgentException("The assistant failed to process your request: " + e.getMessage(), e);
    }

    return outcome;
  }

  /** A generated form takes precedence over data for the envelope type. */
  private void applyArtifact(TurnOutcome outcome, ToolResult result) {
    if (result.getType() == ResponseType.FORM) {
      outcome.type = ResponseType.FORM;
      outcome.form = (FormDto) result.getClientArtifact();
    } else if (result.getType() == ResponseType.DATA && outcome.type != ResponseType.FORM) {
      outcome.type = ResponseType.DATA;
      outcome.data = result.getClientArtifact();
    }
  }

  private String defaultMessage(ResponseType type) {
    return switch (type) {
      case FORM -> "I've prepared a form for you.";
      case DATA -> "Here's what I found.";
      case MESSAGE -> "I'm here to help with your forms. What would you like to do?";
    };
  }

  private static final class TurnOutcome {
    private ResponseType type = ResponseType.MESSAGE;
    private String text;
    private Object data;
    private FormDto form;
  }
}
