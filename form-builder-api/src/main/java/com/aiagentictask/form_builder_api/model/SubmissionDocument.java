package com.aiagentictask.form_builder_api.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "submissions")
@Data
public class SubmissionDocument {

    @Id
    private String id;

    private String formId;

    private Map<String, String> answers = new LinkedHashMap<>();

    private Instant submittedAt;
}
