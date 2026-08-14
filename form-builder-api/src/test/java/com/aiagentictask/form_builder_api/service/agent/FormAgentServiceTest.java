package com.aiagentictask.form_builder_api.service.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
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
import com.google.genai.types.Candidate;
import com.google.genai.types.Content;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.junit.jupiter.api.Test;

class FormAgentServiceTest {

  private static final String USER_MESSAGE = "what forms do we have?";

  private final ChatMemoryService memory = mock(ChatMemoryService.class);

  private FormAgentService service(AgentModelClient modelClient, AgentTool... tools) {
    ChatSessionDocument session = new ChatSessionDocument();
    session.setId("session-1");
    when(memory.loadOrCreate(any())).thenReturn(session);
    when(memory.buildContents(any(), any()))
        .thenReturn(new ArrayList<>(List.of(textContent("user", USER_MESSAGE))));
    return new FormAgentService(modelClient, new AgentProperties(), new ToolRegistry(List.of(tools)), memory);
  }

  @Test
  void dataToolProducesDataEnvelope() {
    Object artifact = Map.of("kind", "forms");
    AgentTool listForms = stub("list_forms", ToolResult.data(Map.of("count", 2), artifact));
    AgentModelClient client = new QueuedModelClient(
        functionCall("list_forms"),
        text("Here are your forms."));

    AgentResponse response = service(client, listForms).chat(null, USER_MESSAGE, null);

    assertEquals(ResponseType.DATA, response.getType());
    assertSame(artifact, response.getData());
    assertNull(response.getForm());
    assertEquals("Here are your forms.", response.getMessage());
    assertEquals("session-1", response.getSessionId());
    verify(memory).recordTurn(any(), eq(USER_MESSAGE), eq("Here are your forms."));
  }

  @Test
  void generateToolProducesFormEnvelope() {
    FormDto form = new FormDto();
    form.setTitle("Contact us");
    AgentTool generate = stub("generate_form", ToolResult.form(Map.of("generated", true), form));
    AgentModelClient client = new QueuedModelClient(
        functionCall("generate_form"),
        text("Done! I built a contact form."));

    AgentResponse response = service(client, generate).chat(null, "build a contact form", null);

    assertEquals(ResponseType.FORM, response.getType());
    assertSame(form, response.getForm());
    assertNull(response.getData());
    assertEquals("Done! I built a contact form.", response.getMessage());
  }

  @Test
  void plainTextProducesMessageEnvelope() {
    AgentModelClient client = new QueuedModelClient(text("You can add a rating field for feedback."));

    AgentResponse response = service(client).chat(null, "any ideas for my form?", null);

    assertEquals(ResponseType.MESSAGE, response.getType());
    assertNull(response.getData());
    assertNull(response.getForm());
    assertEquals("You can add a rating field for feedback.", response.getMessage());
  }

  @Test
  void unknownToolFails() {
    AgentModelClient client = new QueuedModelClient(functionCall("does_not_exist"));

    assertThrows(AgentException.class, () -> service(client).chat(null, USER_MESSAGE, null));
  }

  // --- helpers ---

  private static AgentTool stub(String name, ToolResult result) {
    return new AgentTool() {
      @Override
      public String name() {
        return name;
      }

      @Override
      public FunctionDeclaration declaration() {
        return FunctionDeclaration.builder().name(name).build();
      }

      @Override
      public ToolResult execute(Map<String, Object> args, AgentContext context) {
        return result;
      }
    };
  }

  private static Content textContent(String role, String text) {
    return Content.builder().role(role).parts(List.of(Part.fromText(text))).build();
  }

  private static GenerateContentResponse functionCall(String name) {
    Content content = Content.builder().role("model")
        .parts(List.of(Part.fromFunctionCall(name, Map.of())))
        .build();
    return GenerateContentResponse.builder()
        .candidates(List.of(Candidate.builder().content(content).build()))
        .build();
  }

  private static GenerateContentResponse text(String text) {
    Content content = Content.builder().role("model")
        .parts(List.of(Part.fromText(text)))
        .build();
    return GenerateContentResponse.builder()
        .candidates(List.of(Candidate.builder().content(content).build()))
        .build();
  }

  private static final class QueuedModelClient implements AgentModelClient {
    private final Deque<GenerateContentResponse> responses = new ArrayDeque<>();

    QueuedModelClient(GenerateContentResponse... responses) {
      for (GenerateContentResponse response : responses) {
        this.responses.add(response);
      }
    }

    @Override
    public GenerateContentResponse generate(List<Content> contents) {
      return responses.poll();
    }
  }
}
