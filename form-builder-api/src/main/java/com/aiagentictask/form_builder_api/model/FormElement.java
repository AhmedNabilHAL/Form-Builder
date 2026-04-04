package com.aiagentictask.form_builder_api.model;

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
        @JsonSubTypes.Type(value = TextInputElement.class, name = "text-input"),
        @JsonSubTypes.Type(value = SelectInputElement.class, name = "select-input"),
        @JsonSubTypes.Type(value = FileUploadElement.class, name = "file-upload")
})
@Data
public abstract class FormElement {

    private String id;
    private String title;
    private boolean required;
    private Integer sortOrder;
    private String type;
}
