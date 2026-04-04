package com.aiagentictask.form_builder_api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.mapper.SubmissionMapper;
import com.aiagentictask.form_builder_api.model.FormDocument;
import com.aiagentictask.form_builder_api.model.SubmissionDocument;
import com.aiagentictask.form_builder_api.repository.FormRepository;
import com.aiagentictask.form_builder_api.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public SubmissionDto createMultipart(
            String formId,
            String answersJson,
            Map<String, MultipartFile> files
    ) {
        log.info("Creating multipart submission for formId={}", formId);

        FormDocument form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found with id: " + formId));

        Map<String, String> parsedAnswers = parseAnswers(answersJson);
        Map<String, String> finalAnswers = new LinkedHashMap<>(parsedAnswers);

        for (Map.Entry<String, MultipartFile> entry : files.entrySet()) {
            String fieldId = entry.getKey();
            MultipartFile file = entry.getValue();

            if (file != null && !file.isEmpty()) {
                String storedPath = storeFile(file);
                finalAnswers.put(fieldId, storedPath);
            }
        }

        SubmissionDocument document = new SubmissionDocument();
        document.setId(UUID.randomUUID().toString());
        document.setFormId(form.getId());
        document.setAnswers(finalAnswers);
        document.setSubmittedAt(Instant.now());

        SubmissionDocument saved = submissionRepository.save(document);
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
                        "Submission not found with id: " + submissionId + " for form id: " + formId
                ));

        return submissionMapper.toDto(document);
    }

    private void ensureFormExists(String formId) {
        formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException(FORM_NOT_FOUND_WITH_ID + formId));
    }
    private Map<String, String> parseAnswers(String answersJson) {
        return objectMapper.readValue(
                answersJson,
                new TypeReference<Map<String, String>>() {}
        );
    }

    private String storeFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String safeFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(safeFileName);

            file.transferTo(filePath);

            return filePath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }
    }
}
