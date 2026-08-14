package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.service.FormService;
import com.aiagentictask.form_builder_api.service.agent.AgentContext;
import com.google.genai.types.FunctionDeclaration;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Lists every form in the system as a compact summary. Lets the agent answer
 * questions about what forms exist and what they are about.
 */
@Component
@RequiredArgsConstructor
public class ListFormsTool implements AgentTool {

  private final FormService formService;

  @Override
  public String name() {
    return "list_forms";
  }

  @Override
  public FunctionDeclaration declaration() {
    return FunctionDeclaration.builder()
        .name(name())
        .description("List all forms that currently exist in the system. Returns a summary "
            + "(id, title, description, field count) for each form. Use this to answer questions "
            + "about what forms exist or what they are generally about.")
        .build();
  }

  @Override
  public ToolResult execute(Map<String, Object> args, AgentContext context) {
    List<FormDto> forms = formService.findAll();

    List<Map<String, Object>> summaries = forms.stream().map(form -> {
      Map<String, Object> summary = new LinkedHashMap<>();
      summary.put("id", form.getId());
      summary.put("title", form.getTitle());
      summary.put("description", form.getDescription());
      summary.put("fieldCount", form.getElements() == null ? 0 : form.getElements().size());
      return summary;
    }).toList();

    Map<String, Object> modelResponse = new LinkedHashMap<>();
    modelResponse.put("count", summaries.size());
    modelResponse.put("forms", summaries);

    Map<String, Object> artifact = new LinkedHashMap<>();
    artifact.put("kind", "forms");
    artifact.put("forms", summaries);

    return ToolResult.data(modelResponse, artifact);
  }
}
