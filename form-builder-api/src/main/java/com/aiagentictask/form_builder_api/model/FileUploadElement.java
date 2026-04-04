package com.aiagentictask.form_builder_api.model;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class FileUploadElement extends FormElement {

    public FileUploadElement() {
        setType("file-upload");
    }
}