package com.aiagentictask.form_builder_api.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "forms")
@Data
public class FormDocument {

    @Id
    private String id;

    private String title;
    private String description;
    private List<FormElement> elements = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
