package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.LinkedHashMap;
import java.util.Map;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.service.FormGenerationService;
import com.aiagentictask.form_builder_api.service.agent.AgentContext;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Generates (or refines) a renderable form from a natural-language description.
 * Delegates to {@link FormGenerationService} so the output is validated and
 * enriched with server-assigned ids. Returns the form as the client artifact
 * and
 * only a compact confirmation to the model, to avoid re-feeding a large JSON.
 */
@Component
@RequiredArgsConstructor
public class GenerateFormTool implements AgentTool {

  private final FormGenerationService formGenerationService;

  @Override
  public String name() {
    return "generate_form";
  }

  @Override
  public FunctionDeclaration declaration() {
    Schema parameters = Schema.builder()
        .type("OBJECT")
        .properties(Map.of("prompt", Schema.builder()
            .type("STRING")
            .description("A clear description of the form to build or the change to apply, "
                + "e.g. 'a contact form with name, email and a message field'.")
            .build()))
        .required("prompt")
        .build();

    return FunctionDeclaration.builder()
        .name(name())
        .description("Generate a renderable form definition from a description, or refine the form the "
            + "user is currently editing. Use this only when the user actually wants to create or "
            + "change a form (not for questions or ideas).")
        .parameters(parameters)
        .build();
  }

  @Override
  public ToolResult execute(Map<String, Object> args, AgentContext context) {
    String prompt = args.get("prompt") == null ? "" : args.get("prompt").toString();
    FormDto currentForm = context.getCurrentForm() != null ? context.getCurrentForm() : new FormDto();

    FormDto generated = formGenerationService.generate(prompt, currentForm);

    Map<String, Object> modelResponse = new LinkedHashMap<>();
    modelResponse.put("generated", true);
    modelResponse.put("title", generated.getTitle());
    modelResponse.put("fieldCount", generated.getElements() == null ? 0 : generated.getElements().size());

    return ToolResult.form(modelResponse, generated);
  }
}
