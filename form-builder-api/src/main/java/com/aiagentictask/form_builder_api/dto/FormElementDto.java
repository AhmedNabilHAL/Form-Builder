package com.aiagentictask.form_builder_api.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextInputElementDto.class, name = "text-input"),
        @JsonSubTypes.Type(value = SelectInputElementDto.class, name = "select-input"),
        @JsonSubTypes.Type(value = FileUploadElementDto.class, name = "file-upload")
})
@Data
public abstract class FormElementDto {

    private String id;
    private String title;
    private boolean required;
    private Integer sortOrder;
    private String type;
}
