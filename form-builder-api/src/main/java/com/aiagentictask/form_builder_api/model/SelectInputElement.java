package com.aiagentictask.form_builder_api.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
public class SelectInputElement extends FormElement {

    private List<SelectOption> options = new ArrayList<>();

    public SelectInputElement() {
        setType("select-input");
    }
}