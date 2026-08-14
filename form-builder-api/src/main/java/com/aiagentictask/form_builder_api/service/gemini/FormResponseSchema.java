package com.aiagentictask.form_builder_api.service.gemini;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.genai.types.Schema;
import org.springframework.stereotype.Component;

/**
 * Builds the {@link Schema} handed to Gemini so its output is constrained to
 * the
 * {@code FormDto} shape. Ids and sort order are intentionally omitted; the
 * server assigns those afterwards, which reduces the token cost of each
 * generation and removes a common source of invalid output.
 */
@Component
public class FormResponseSchema {

  private final Schema schema = buildSchema();

  /** Returns the response schema. */
  public Schema schema() {
    return schema;
  }

  private static Schema buildSchema() {
    Schema optionSchema = Schema.builder()
        .type("OBJECT")
        .properties(Map.of("value", Schema.builder().type("STRING").build()))
        .required("value")
        .build();

    Map<String, Schema> elementProperties = new LinkedHashMap<>();
    elementProperties.put("type", Schema.builder()
        .type("STRING")
        .format("enum")
        .enum_(List.of("text-input", "select-input", "file-upload"))
        .build());
    elementProperties.put("title", Schema.builder().type("STRING").build());
    elementProperties.put("required", Schema.builder().type("BOOLEAN").build());
    elementProperties.put("options", Schema.builder()
        .type("ARRAY")
        .items(optionSchema)
        .build());

    Schema elementSchema = Schema.builder()
        .type("OBJECT")
        .properties(elementProperties)
        .required("type", "title", "required")
        .build();

    Map<String, Schema> rootProperties = new LinkedHashMap<>();
    rootProperties.put("title", Schema.builder().type("STRING").build());
    rootProperties.put("description", Schema.builder().type("STRING").build());
    rootProperties.put("elements", Schema.builder()
        .type("ARRAY")
        .items(elementSchema)
        .build());

    return Schema.builder()
        .type("OBJECT")
        .properties(rootProperties)
        .required("title", "elements")
        .build();
  }
}
