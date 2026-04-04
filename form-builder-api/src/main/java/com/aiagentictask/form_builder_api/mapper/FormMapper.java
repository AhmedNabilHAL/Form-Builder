package com.aiagentictask.form_builder_api.mapper;

import java.util.List;

import com.aiagentictask.form_builder_api.dto.*;
import com.aiagentictask.form_builder_api.model.*;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FormMapper {

    FormDto toDto(FormDocument document);

    FormDocument toDocument(FormDto dto);

    SelectOptionDto toDto(SelectOption option);

    SelectOption toDocument(SelectOptionDto dto);

    TextInputElementDto toDto(TextInputElement element);

    TextInputElement toDocument(TextInputElementDto dto);

    SelectInputElementDto toDto(SelectInputElement element);

    SelectInputElement toDocument(SelectInputElementDto dto);

    FileUploadElementDto toDto(FileUploadElement element);

    FileUploadElement toDocument(FileUploadElementDto dto);

    default FormElementDto toDto(FormElement element) {
        if (element instanceof TextInputElement e) {
            return toDto(e);
        }
        if (element instanceof SelectInputElement e) {
            return toDto(e);
        }
        if (element instanceof FileUploadElement e) {
            return toDto(e);
        }
        throw new IllegalArgumentException("Unsupported FormElement type: " + element.getClass());
    }

    default FormElement toDocument(FormElementDto dto) {
        if (dto instanceof TextInputElementDto e) {
            return toDocument(e);
        }
        if (dto instanceof SelectInputElementDto e) {
            return toDocument(e);
        }
        if (dto instanceof FileUploadElementDto e) {
            return toDocument(e);
        }
        throw new IllegalArgumentException("Unsupported FormElementDto type: " + dto.getClass());
    }

    default List<FormElementDto> mapElementsToDto(List<FormElement> elements) {
        return elements == null ? List.of() : elements.stream().map(this::toDto).toList();
    }

    default List<FormElement> mapElementsToDocument(List<FormElementDto> elements) {
        return elements == null ? List.of() : elements.stream().map(this::toDocument).toList();
    }
}
