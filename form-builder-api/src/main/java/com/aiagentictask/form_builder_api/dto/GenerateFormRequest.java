package com.aiagentictask.form_builder_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for {@code POST /api/forms/generate}. Mirrors the frontend
 * {@code GenerateFormRequest}: a natural-language prompt plus the current form
 * so the model can decide which parts to keep.
 */
@Data
public class GenerateFormRequest {

  @NotBlank
  private String prompt;

  private FormDto currentForm;
}
