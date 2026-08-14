package com.aiagentictask.form_builder_api.service.agent.tools;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.ResponseType;
import com.aiagentictask.form_builder_api.dto.TextInputElementDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.service.FormGenerationService;
import com.aiagentictask.form_builder_api.service.FormService;
import com.aiagentictask.form_builder_api.service.SubmissionService;
import org.junit.jupiter.api.Test;

class AgentToolsTest {

  @Test
  void listFormsReturnsDataSummaries() {
    FormService formService = mock(FormService.class);
    when(formService.findAll()).thenReturn(List.of(form("f1", "Contact"), form("f2", "Survey")));

    ToolResult result = new ListFormsTool(formService).execute(Map.of(), null);

    assertEquals(ResponseType.DATA, result.getType());
    assertEquals(2, result.getModelResponse().get("count"));
  }

  @Test
  void getFormDetailsReturnsDataWhenFound() {
    FormService formService = mock(FormService.class);
    when(formService.findById("f1")).thenReturn(form("f1", "Contact"));

    ToolResult result = new GetFormDetailsTool(formService).execute(Map.of("formId", "f1"), null);

    assertEquals(ResponseType.DATA, result.getType());
    assertEquals(Boolean.TRUE, result.getModelResponse().get("found"));
  }

  @Test
  void getFormDetailsReturnsMessageWhenMissing() {
    FormService formService = mock(FormService.class);
    when(formService.findById("nope")).thenThrow(new ResourceNotFoundException("no"));

    ToolResult result = new GetFormDetailsTool(formService).execute(Map.of("formId", "nope"), null);

    assertEquals(ResponseType.MESSAGE, result.getType());
    assertEquals(Boolean.FALSE, result.getModelResponse().get("found"));
  }

  @Test
  void getFormSubmissionsReturnsMessageWhenFormMissing() {
    SubmissionService submissionService = mock(SubmissionService.class);
    when(submissionService.findByFormId("nope")).thenThrow(new ResourceNotFoundException("no"));

    ToolResult result = new GetFormSubmissionsTool(submissionService)
        .execute(Map.of("formId", "nope"), null);

    assertEquals(ResponseType.MESSAGE, result.getType());
    assertEquals(Boolean.FALSE, result.getModelResponse().get("found"));
  }

  @Test
  void generateFormReturnsFormEnvelope() {
    FormGenerationService generationService = mock(FormGenerationService.class);
    FormDto generated = form("f9", "Feedback");
    when(generationService.generate(org.mockito.ArgumentMatchers.eq("a feedback form"),
        org.mockito.ArgumentMatchers.any())).thenReturn(generated);

    ToolResult result = new GenerateFormTool(generationService)
        .execute(Map.of("prompt", "a feedback form"),
            new com.aiagentictask.form_builder_api.service.agent.AgentContext("s1", null));

    assertEquals(ResponseType.FORM, result.getType());
    assertEquals(generated, result.getClientArtifact());
    assertEquals(Boolean.TRUE, result.getModelResponse().get("generated"));
  }

  @Test
  void toolRegistryBuildsToolAndResolvesByName() {
    FormService formService = mock(FormService.class);
    ListFormsTool listForms = new ListFormsTool(formService);
    ToolRegistry registry = new ToolRegistry(List.of(listForms));

    assertTrue(registry.find("list_forms").isPresent());
    assertFalse(registry.find("missing").isPresent());
    assertTrue(registry.geminiTool().functionDeclarations().isPresent());
  }

  private static FormDto form(String id, String title) {
    FormDto form = new FormDto();
    form.setId(id);
    form.setTitle(title);
    TextInputElementDto field = new TextInputElementDto();
    field.setTitle("Name");
    form.setElements(new java.util.ArrayList<>(List.of(field)));
    return form;
  }
}
