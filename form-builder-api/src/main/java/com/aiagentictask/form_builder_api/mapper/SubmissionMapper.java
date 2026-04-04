package com.aiagentictask.form_builder_api.mapper;

import java.time.Instant;

import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.model.SubmissionDocument;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(target = "submittedAt", expression = "java(toIsoString(document.getSubmittedAt()))")
    SubmissionDto toDto(SubmissionDocument document);

    @Mapping(target = "submittedAt", ignore = true)
    SubmissionDocument toDocument(SubmissionDto dto);

    default String toIsoString(Instant instant) {
        return instant == null ? null : instant.toString();
    }
}
