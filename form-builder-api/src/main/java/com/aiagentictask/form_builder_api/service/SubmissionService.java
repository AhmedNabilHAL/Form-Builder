package com.aiagentictask.form_builder_api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aiagentictask.form_builder_api.configuration.StorageProperties;
import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.exception.InvalidFileException;
import com.aiagentictask.form_builder_api.exception.InvalidSubmissionException;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.mapper.SubmissionMapper;
import com.aiagentictask.form_builder_api.model.FormDocument;
import com.aiagentictask.form_builder_api.model.FormElement;
import com.aiagentictask.form_builder_api.model.SubmissionDocument;
import com.aiagentictask.form_builder_api.repository.FormRepository;
import com.aiagentictask.form_builder_api.repository.SubmissionRepository;
import com.aiagentictask.form_builder_api.service.storage.FileStorageService;
import com.aiagentictask.form_builder_api.service.storage.StoredFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {
    private static final String FORM_NOT_FOUND_WITH_ID = "Form not found with id: ";

    private final SubmissionRepository submissionRepository;
    private final FormRepository formRepository;
    private final SubmissionMapper submissionMapper;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;
    private final StorageProperties storageProperties;

    public SubmissionDto createMultipart(
            String formId,
            String answersJson,
            Map<String, MultipartFile> files) {
        log.info("Creating multipart submission for formId={}", formId);

        FormDocument form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found with id: " + formId));

        Map<String, FormElement> elementsById = indexElements(form);
        Map<String, String> parsedAnswers = parseAnswers(answersJson);
        Map<String, String> finalAnswers = filterTextAnswers(parsedAnswers, elementsById);
        Map<String, MultipartFile> submittedFiles = files == null ? Collections.emptyMap() : files;

        for (Map.Entry<String, MultipartFile> entry : submittedFiles.entrySet()) {
            String fieldId = entry.getKey();
            MultipartFile file = entry.getValue();

            if (file != null && !file.isEmpty()) {
                validateUploadField(fieldId, elementsById);
                validateFile(file);
            }
        }

        List<String> storedKeys = new ArrayList<>();
        SubmissionDocument saved;
        try {
            for (Map.Entry<String, MultipartFile> entry : submittedFiles.entrySet()) {
                MultipartFile file = entry.getValue();
                if (file == null || file.isEmpty()) {
                    continue;
                }

                String storageKey = fileStorageService.store(file, form.getId());
                storedKeys.add(storageKey);
                finalAnswers.put(entry.getKey(), storageKey);
            }

            SubmissionDocument document = new SubmissionDocument();
            document.setId(UUID.randomUUID().toString());
            document.setFormId(form.getId());
            document.setAnswers(finalAnswers);
            document.setSubmittedAt(Instant.now());
            saved = submissionRepository.save(document);
        } catch (RuntimeException ex) {
            rollbackUploads(storedKeys, form.getId());
            throw ex;
        }

        return submissionMapper.toDto(saved);
    }

    public List<SubmissionDto> findByFormId(String formId) {
        log.info("Fetching submissions for formId={}", formId);

        ensureFormExists(formId);

        return submissionRepository.findByFormIdOrderBySubmittedAtDesc(formId)
                .stream()
                .map(submissionMapper::toDto)
                .toList();
    }

    public SubmissionDto findById(String formId, String submissionId) {
        log.info("Fetching submission id={} for formId={}", submissionId, formId);

        ensureFormExists(formId);

        SubmissionDocument document = submissionRepository.findByIdAndFormId(submissionId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission not found with id: " + submissionId + " for form id: " + formId));

        return submissionMapper.toDto(document);
    }

    private void ensureFormExists(String formId) {
        formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + formId));
    }

    /**
     * Resolves and loads a file attached to a submission. Only fields declared as
     * {@code file-upload} on the form are served, which prevents arbitrary
     * storage keys from being fetched through this endpoint.
     */
    public StoredFile loadSubmissionFile(String formId, String submissionId, String fieldId) {
        log.info("Loading file for formId={} submissionId={} fieldId={}", formId, submissionId, fieldId);

        FormDocument form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + formId));

        FormElement field = indexElements(form).get(fieldId);
        if (field == null || !"file-upload".equals(field.getType())) {
            throw new ResourceNotFoundException("No file field with id: " + fieldId + " for form id: " + formId);
        }

        SubmissionDocument document = submissionRepository.findByIdAndFormId(submissionId, formId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission not found with id: " + submissionId + " for form id: " + formId));

        String storageKey = document.getAnswers() == null ? null : document.getAnswers().get(fieldId);
        if (storageKey == null || storageKey.isBlank()) {
            throw new ResourceNotFoundException(
                    "No file stored for field: " + fieldId + " in submission: " + submissionId);
        }

        return fileStorageService.load(storageKey, formId);
    }

    private void validateFile(MultipartFile file) {
        long maxBytes = storageProperties.getMaxFileSizeBytes();
        if (file.getSize() > maxBytes) {
            throw new InvalidFileException(
                    "File '" + file.getOriginalFilename() + "' exceeds the maximum allowed size of "
                            + maxBytes + " bytes");
        }

        List<String> allowed = storageProperties.getAllowedContentTypes();
        String contentType = file.getContentType();
        boolean contentTypeAllowed = contentType != null
                && allowed != null
                && allowed.stream().anyMatch(contentType::equalsIgnoreCase);
        if (allowed != null && !allowed.isEmpty() && !contentTypeAllowed) {
            throw new InvalidFileException(
                    "File type '" + contentType + "' is not allowed for '" + file.getOriginalFilename() + "'");
        }
    }

    private void validateUploadField(String fieldId, Map<String, FormElement> elementsById) {
        FormElement element = elementsById.get(fieldId);
        if (element == null || !"file-upload".equals(element.getType())) {
            throw new InvalidFileException(
                    "A file was supplied for an unknown or non-file field: " + fieldId);
        }
    }

    private Map<String, FormElement> indexElements(FormDocument form) {
        Map<String, FormElement> elementsById = new LinkedHashMap<>();
        if (form.getElements() == null) {
            return elementsById;
        }

        for (FormElement element : form.getElements()) {
            if (element != null && element.getId() != null) {
                elementsById.put(element.getId(), element);
            }
        }
        return elementsById;
    }

    /**
     * Keeps only declared non-file fields. File-field values must come from an
     * uploaded file, never from a client-provided storage key.
     */
    private Map<String, String> filterTextAnswers(
            Map<String, String> parsedAnswers,
            Map<String, FormElement> elementsById) {
        Map<String, String> filtered = new LinkedHashMap<>();
        elementsById.forEach((fieldId, element) -> {
            if (!"file-upload".equals(element.getType()) && parsedAnswers.containsKey(fieldId)) {
                filtered.put(fieldId, parsedAnswers.get(fieldId));
            }
        });
        return filtered;
    }

    private void rollbackUploads(List<String> storageKeys, String formId) {
        for (String storageKey : storageKeys) {
            try {
                fileStorageService.delete(storageKey, formId);
            } catch (RuntimeException cleanupError) {
                log.warn("Failed to roll back uploaded file {}", storageKey, cleanupError);
            }
        }
    }

    private Map<String, String> parseAnswers(String answersJson) {
        try {
            if (answersJson == null || answersJson.isBlank()) {
                throw new IllegalArgumentException("answers payload is blank");
            }
            Map<String, String> answers = objectMapper.readValue(
                    answersJson,
                    new TypeReference<Map<String, String>>() {
                    });
            return answers == null ? new LinkedHashMap<>() : answers;
        } catch (Exception ex) {
            throw new InvalidSubmissionException(
                    "Submission answers must be a JSON object containing field IDs and string values",
                    ex);
        }
    }
}
