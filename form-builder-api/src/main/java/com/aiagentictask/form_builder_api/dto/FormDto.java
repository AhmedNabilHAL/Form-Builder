package com.aiagentictask.form_builder_api.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FormDto {

    private String id;
    private String title;
    private String description;
    private List<FormElementDto> elements = new ArrayList<>();
}
