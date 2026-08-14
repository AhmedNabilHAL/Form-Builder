package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.FormElementDto;
import com.aiagentictask.form_builder_api.dto.SelectInputElementDto;
import com.aiagentictask.form_builder_api.dto.SelectOptionDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.service.FormService;
import com.aiagentictask.form_builder_api.service.agent.AgentContext;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Reads a single form's full structure by id, so the agent can explain exactly
 * what a form asks about (its fields, types, and options).
 */
@Component
@RequiredArgsConstructor
public class GetFormDetailsTool implements AgentTool {

  private final FormService formService;

  @Override
  public String name() {
    return "get_form_details";
  }

  @Override
  public FunctionDeclaration declaration() {
    Schema parameters = Schema.builder()
        .type("OBJECT")
        .properties(Map.of("formId", Schema.builder()
            .type("STRING")
            .description("The id of the form to inspect (obtain it from list_forms).")
            .build()))
        .required("formId")
        .build();

    return FunctionDeclaration.builder()
        .name(name())
        .description("Get the full details of one form by its id: its title, description, and each "
            + "field (type, label, whether required, and select options). Use this to explain what "
            + "a specific form asks about.")
        .parameters(parameters)
        .build();
  }

  @Override
  public ToolResult execute(Map<String, Object> args, AgentContext context) {
    String formId = args.get("formId") == null ? "" : args.get("formId").toString();

    FormDto form;
    try {
      form = formService.findById(formId);
    } catch (ResourceNotFoundException e) {
      Map<String, Object> notFound = new LinkedHashMap<>();
      notFound.put("found", false);
      notFound.put("formId", formId);
      return ToolResult.message(notFound);
    }

    Map<String, Object> modelResponse = new LinkedHashMap<>();
    modelResponse.put("found", true);
    modelResponse.put("id", form.getId());
    modelResponse.put("title", form.getTitle());
    modelResponse.put("description", form.getDescription());
    modelResponse.put("fields", describeFields(form.getElements()));

    return ToolResult.data(modelResponse, form);
  }

  private List<Map<String, Object>> describeFields(List<FormElementDto> elements) {
    if (elements == null) {
      return List.of();
    }
    return elements.stream().map(element -> {
      Map<String, Object> field = new LinkedHashMap<>();
      field.put("title", element.getTitle());
      field.put("type", element.getType());
      field.put("required", element.isRequired());
      if (element instanceof SelectInputElementDto select) {
        field.put("options", select.getOptions().stream()
            .map(SelectOptionDto::getValue)
            .toList());
      }
      return field;
    }).toList();
  }
}
