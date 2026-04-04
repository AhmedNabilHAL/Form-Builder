package com.aiagentictask.form_builder_api.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class TextInputElementDto extends FormElementDto {

    public TextInputElementDto() {
        setType("text-input");
    }
}
