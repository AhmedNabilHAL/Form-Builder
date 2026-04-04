package com.aiagentictask.form_builder_api.dto;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class SubmissionDto {
    private String id;
    private String formId;
    private Map<String, String> answers = new LinkedHashMap<>();
    private String submittedAt;
}
