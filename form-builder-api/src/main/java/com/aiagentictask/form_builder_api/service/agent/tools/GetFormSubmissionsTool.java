package com.aiagentictask.form_builder_api.service.agent.tools;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.service.SubmissionService;
import com.aiagentictask.form_builder_api.service.agent.AgentContext;
import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Reads the submissions (answers) stored for a form, so the agent can report on
 * the data collected so far.
 */
@Component
@RequiredArgsConstructor
public class GetFormSubmissionsTool implements AgentTool {

  private final SubmissionService submissionService;

  @Override
  public String name() {
    return "get_form_submissions";
  }

  @Override
  public FunctionDeclaration declaration() {
    Schema parameters = Schema.builder()
        .type("OBJECT")
        .properties(Map.of("formId", Schema.builder()
            .type("STRING")
            .description("The id of the form whose submissions/answers to read.")
            .build()))
        .required("formId")
        .build();

    return FunctionDeclaration.builder()
        .name(name())
        .description("Get the submissions (answers) stored for a form by its id: how many there are "
            + "and the answers for each. Use this to report on the data collected for a form.")
        .parameters(parameters)
        .build();
  }

  @Override
  public ToolResult execute(Map<String, Object> args, AgentContext context) {
    String formId = args.get("formId") == null ? "" : args.get("formId").toString();

    List<SubmissionDto> submissions;
    try {
      submissions = submissionService.findByFormId(formId);
    } catch (ResourceNotFoundException e) {
      Map<String, Object> notFound = new LinkedHashMap<>();
      notFound.put("found", false);
      notFound.put("formId", formId);
      return ToolResult.message(notFound);
    }

    List<Map<String, Object>> rows = submissions.stream().map(submission -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("submissionId", submission.getId());
      row.put("submittedAt", submission.getSubmittedAt());
      row.put("answers", submission.getAnswers());
      return row;
    }).toList();

    Map<String, Object> modelResponse = new LinkedHashMap<>();
    modelResponse.put("found", true);
    modelResponse.put("formId", formId);
    modelResponse.put("count", rows.size());
    modelResponse.put("submissions", rows);

    Map<String, Object> artifact = new LinkedHashMap<>();
    artifact.put("kind", "submissions");
    artifact.put("formId", formId);
    artifact.put("count", rows.size());
    artifact.put("submissions", rows);

    return ToolResult.data(modelResponse, artifact);
  }
}
