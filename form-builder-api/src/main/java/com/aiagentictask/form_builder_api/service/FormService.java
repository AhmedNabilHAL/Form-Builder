package com.aiagentictask.form_builder_api.service;

import java.time.Instant;
import java.util.List;

import com.aiagentictask.form_builder_api.dto.FormDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.mapper.FormMapper;
import com.aiagentictask.form_builder_api.model.FormDocument;
import com.aiagentictask.form_builder_api.repository.FormRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class FormService {
    private static final String FORM_NOT_FOUND_WITH_ID = "Form not found with id: ";

    private final FormRepository formRepository;
    private final FormMapper formMapper;

    public FormDto create(FormDto formDto) {
        log.info("Creating form with title={}", formDto.getTitle());

        FormDocument document = formMapper.toDocument(formDto);
        document.setId(null);
        document.setCreatedAt(Instant.now());
        document.setUpdatedAt(Instant.now());

        FormDocument saved = formRepository.save(document);
        return formMapper.toDto(saved);
    }

    public List<FormDto> findAll() {
        log.info("Fetching all forms");

        return formRepository.findAll()
                .stream()
                .map(formMapper::toDto)
                .toList();
    }

    public FormDto findById(String id) {
        log.info("Fetching form by id={}", id);

        FormDocument document = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + id));

        return formMapper.toDto(document);
    }

    public FormDto update(String id, FormDto formDto) {
        log.info("Updating form id={}", id);

        FormDocument existing = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + id));

        existing.setTitle(formDto.getTitle());
        existing.setDescription(formDto.getDescription());
        existing.setElements(formMapper.mapElementsToDocument(formDto.getElements()));
        existing.setUpdatedAt(Instant.now());

        FormDocument saved = formRepository.save(existing);
        return formMapper.toDto(saved);
    }

    public void delete(String id) {
        log.info("Deleting form id={}", id);

        FormDocument existing = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + id));

        formRepository.delete(existing);
    }
}
