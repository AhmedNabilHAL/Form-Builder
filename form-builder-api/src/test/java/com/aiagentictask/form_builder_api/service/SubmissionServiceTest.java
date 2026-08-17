package com.aiagentictask.form_builder_api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.aiagentictask.form_builder_api.configuration.StorageProperties;
import com.aiagentictask.form_builder_api.dto.SubmissionDto;
import com.aiagentictask.form_builder_api.exception.InvalidFileException;
import com.aiagentictask.form_builder_api.exception.InvalidSubmissionException;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.aiagentictask.form_builder_api.mapper.SubmissionMapper;
import com.aiagentictask.form_builder_api.model.FileUploadElement;
import com.aiagentictask.form_builder_api.model.FormDocument;
import com.aiagentictask.form_builder_api.model.SubmissionDocument;
import com.aiagentictask.form_builder_api.model.TextInputElement;
import com.aiagentictask.form_builder_api.repository.FormRepository;
import com.aiagentictask.form_builder_api.repository.SubmissionRepository;
import com.aiagentictask.form_builder_api.service.storage.FileStorageService;
import com.aiagentictask.form_builder_api.service.storage.StoredFile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.ObjectMapper;

class SubmissionServiceTest {

  private SubmissionRepository submissionRepository;
  private FormRepository formRepository;
  private SubmissionMapper submissionMapper;
  private FileStorageService fileStorageService;
  private StorageProperties storageProperties;
  private SubmissionService service;

  @BeforeEach
  void setUp() {
    submissionRepository = mock(SubmissionRepository.class);
    formRepository = mock(FormRepository.class);
    submissionMapper = mock(SubmissionMapper.class);
    fileStorageService = mock(FileStorageService.class);
    storageProperties = new StorageProperties();

    when(submissionRepository.save(any(SubmissionDocument.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    when(submissionMapper.toDto(any(SubmissionDocument.class))).thenReturn(new SubmissionDto());

    service = new SubmissionService(
        submissionRepository,
        formRepository,
        submissionMapper,
        new ObjectMapper(),
        fileStorageService,
        storageProperties);
  }

  @Test
  void storesUploadedFileAndIgnoresClientSuppliedStorageKeys() {
    FormDocument form = form();
    MockMultipartFile file = png("attachment", "proof.png");
    String storedKey = "submissions/form-1/11111111-1111-1111-1111-111111111111_proof.png";

    when(formRepository.findById("form-1")).thenReturn(Optional.of(form));
    when(fileStorageService.store(file, "form-1")).thenReturn(storedKey);

    service.createMultipart(
        "form-1",
        """
            {
              "name": "Alice",
              "attachment": "submissions/another-form/private.pdf",
              "unknown": "ignored"
            }
            """,
        Map.of("attachment", file));

    ArgumentCaptor<SubmissionDocument> captor = ArgumentCaptor.forClass(SubmissionDocument.class);
    verify(submissionRepository).save(captor.capture());

    assertEquals("Alice", captor.getValue().getAnswers().get("name"));
    assertEquals(storedKey, captor.getValue().getAnswers().get("attachment"));
    assertEquals(2, captor.getValue().getAnswers().size());
  }

  @Test
  void rejectsFileSuppliedForNonFileField() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));
    MockMultipartFile file = png("name", "proof.png");

    assertThrows(
        InvalidFileException.class,
        () -> service.createMultipart("form-1", "{\"name\":\"Alice\"}", Map.of("name", file)));

    verify(fileStorageService, never()).store(any(), any());
    verify(submissionRepository, never()).save(any());
  }

  @Test
  void rejectsDisallowedFileType() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));
    MockMultipartFile file = new MockMultipartFile(
        "attachment",
        "script.js",
        "application/javascript",
        "alert(1)".getBytes());

    assertThrows(
        InvalidFileException.class,
        () -> service.createMultipart("form-1", "{}", Map.of("attachment", file)));

    verify(fileStorageService, never()).store(any(), any());
  }

  @Test
  void rejectsOversizedFile() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));
    storageProperties.setMaxFileSizeBytes(2);
    MockMultipartFile file = png("attachment", "proof.png");

    assertThrows(
        InvalidFileException.class,
        () -> service.createMultipart("form-1", "{}", Map.of("attachment", file)));

    verify(fileStorageService, never()).store(any(), any());
  }

  @Test
  void rollsBackStoredFileWhenSubmissionPersistenceFails() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));
    MockMultipartFile file = png("attachment", "proof.png");
    String storedKey = "submissions/form-1/11111111-1111-1111-1111-111111111111_proof.png";
    when(fileStorageService.store(file, "form-1")).thenReturn(storedKey);
    when(submissionRepository.save(any(SubmissionDocument.class)))
        .thenThrow(new RuntimeException("database unavailable"));

    assertThrows(
        RuntimeException.class,
        () -> service.createMultipart("form-1", "{}", Map.of("attachment", file)));

    verify(fileStorageService).delete(storedKey, "form-1");
  }

  @Test
  void loadsOnlyTheFileReferencedByTheRequestedSubmission() {
    FormDocument form = form();
    SubmissionDocument submission = new SubmissionDocument();
    submission.setId("submission-1");
    submission.setFormId("form-1");
    submission.setAnswers(Map.of(
        "attachment",
        "submissions/form-1/11111111-1111-1111-1111-111111111111_proof.png"));
    StoredFile storedFile = new StoredFile(new byte[] { 1, 2, 3 }, "image/png", "proof.png");

    when(formRepository.findById("form-1")).thenReturn(Optional.of(form));
    when(submissionRepository.findByIdAndFormId("submission-1", "form-1"))
        .thenReturn(Optional.of(submission));
    when(fileStorageService.load(
        "submissions/form-1/11111111-1111-1111-1111-111111111111_proof.png",
        "form-1"))
        .thenReturn(storedFile);

    StoredFile result = service.loadSubmissionFile("form-1", "submission-1", "attachment");

    assertSame(storedFile, result);
  }

  @Test
  void rejectsDownloadForNonFileField() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));

    assertThrows(
        ResourceNotFoundException.class,
        () -> service.loadSubmissionFile("form-1", "submission-1", "name"));

    verify(fileStorageService, never()).load(any(), any());
  }

  @Test
  void rejectsMalformedAnswersJson() {
    when(formRepository.findById("form-1")).thenReturn(Optional.of(form()));

    assertThrows(
        InvalidSubmissionException.class,
        () -> service.createMultipart("form-1", "not-json", Map.of()));

    verify(submissionRepository, never()).save(any());
  }

  private static FormDocument form() {
    TextInputElement name = new TextInputElement();
    name.setId("name");
    name.setTitle("Name");

    FileUploadElement attachment = new FileUploadElement();
    attachment.setId("attachment");
    attachment.setTitle("Attachment");

    FormDocument form = new FormDocument();
    form.setId("form-1");
    form.setElements(List.of(name, attachment));
    return form;
  }

  private static MockMultipartFile png(String fieldId, String fileName) {
    return new MockMultipartFile(
        fieldId,
        fileName,
        "image/png",
        new byte[] { 1, 2, 3 });
  }
}
