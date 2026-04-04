package com.aiagentictask.form_builder_api.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class SelectInputElementDto extends FormElementDto {

    private List<SelectOptionDto> options = new ArrayList<>();

    public SelectInputElementDto() {
        setType("select-input");
    }
}