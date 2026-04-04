package com.aiagentictask.form_builder_api.controller;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.service.FormService;
import com.aiagentictask.form_builder_api.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/forms")
@RequiredArgsConstructor
@Slf4j
public class FormController {
    private final FormService formService;
    private final SubmissionService submissionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FormDto create(@RequestBody FormDto formDto) {
        log.info("POST /api/forms");
        return formService.create(formDto);
    }

    @GetMapping
    public List<FormDto> findAll() {
        log.info("GET /api/forms");
        return formService.findAll();
    }

    @GetMapping("/{id}")
    public FormDto findById(@PathVariable String id) {
        log.info("GET /api/forms/{}", id);
        return formService.findById(id);
    }

    @PutMapping("/{id}")
    public FormDto update(@PathVariable String id, @RequestBody FormDto formDto) {
        log.info("PUT /api/forms/{}", id);
        return formService.update(id, formDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        log.info("DELETE /api/forms/{}", id);
        formService.delete(id);
    }

    @PostMapping(path = "/{formId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionDto create(
            @PathVariable String formId,
            @RequestParam("answers") String answersJson,
            MultipartHttpServletRequest request
    ) {
        log.info("POST /api/forms/{}/submissions", formId);
        return submissionService.createMultipart(formId, answersJson, request.getFileMap());
    }

    @GetMapping("/{formId}/submissions")
    public List<SubmissionDto> findByFormId(@PathVariable String formId) {
        log.info("GET /api/forms/{}/submissions", formId);
        return submissionService.findByFormId(formId);
    }

    @GetMapping("/{formId}/submissions/{submissionId}")
    public SubmissionDto findById(
            @PathVariable String formId,
            @PathVariable String submissionId
    ) {
        log.info("GET /api/forms/{}/submissions/{}", formId, submissionId);
        return submissionService.findById(formId, submissionId);
    }
}