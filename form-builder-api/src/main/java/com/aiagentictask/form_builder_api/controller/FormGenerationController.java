package com.aiagentictask.form_builder_api.controller;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.GenerateFormRequest;
import com.aiagentictask.form_builder_api.service.FormGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI-assisted form generation endpoint. Kept separate from
 * {@link FormController}
 * so the AI concern stays isolated from CRUD.
 */
@RestController
@RequestMapping("/api/forms")
@RequiredArgsConstructor
@Slf4j
public class FormGenerationController {

  private final FormGenerationService formGenerationService;

  @PostMapping("/generate")
  public FormDto generate(@Valid @RequestBody GenerateFormRequest request) {
    log.info("POST /api/forms/generate");
    FormDto currentForm = request.getCurrentForm() != null ? request.getCurrentForm() : new FormDto();
    return formGenerationService.generate(request.getPrompt(), currentForm);
  }
}
