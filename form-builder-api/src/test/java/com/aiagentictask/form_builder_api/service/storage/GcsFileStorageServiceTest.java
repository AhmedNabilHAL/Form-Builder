package com.aiagentictask.form_builder_api.service.storage;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Map;

import com.aiagentictask.form_builder_api.configuration.StorageProperties;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

class GcsFileStorageServiceTest {

  private Storage storage;
  private StorageProperties properties;
  private GcsFileStorageService service;

  @BeforeEach
  void setUp() {
    storage = mock(Storage.class);
    properties = new StorageProperties();
    properties.setBucketName("form-builder-files");
    service = new GcsFileStorageService(storage, properties);
  }

  @Test
  void storesObjectUnderFormPrefixWithMetadata() {
    MockMultipartFile file = new MockMultipartFile(
        "attachment",
        "proof.png",
        "image/png",
        new byte[] { 1, 2, 3 });

    String key = service.store(file, "form-1");

    ArgumentCaptor<BlobInfo> blobInfo = ArgumentCaptor.forClass(BlobInfo.class);
    verify(storage).create(
        blobInfo.capture(),
        eq(new byte[] { 1, 2, 3 }),
        any(Storage.BlobTargetOption.class));

    assertTrue(key.startsWith("submissions/form-1/"));
    assertEquals("form-builder-files", blobInfo.getValue().getBucket());
    assertEquals(key, blobInfo.getValue().getName());
    assertEquals("image/png", blobInfo.getValue().getContentType());
    assertEquals("proof.png", blobInfo.getValue().getMetadata().get("originalFilename"));
  }

  @Test
  void loadsContentAndOriginalFileName() {
    String key = "submissions/form-1/11111111-1111-1111-1111-111111111111_proof.png";
    Blob blob = mock(Blob.class);
    when(storage.get(BlobId.of("form-builder-files", key))).thenReturn(blob);
    when(blob.getContent()).thenReturn(new byte[] { 1, 2, 3 });
    when(blob.getContentType()).thenReturn("image/png");
    when(blob.getMetadata()).thenReturn(Map.of("originalFilename", "proof.png"));

    StoredFile result = service.load(key, "form-1");

    assertArrayEquals(new byte[] { 1, 2, 3 }, result.content());
    assertEquals("image/png", result.contentType());
    assertEquals("proof.png", result.fileName());
  }

  @Test
  void rejectsObjectOutsideRequestedFormNamespace() {
    String key = "submissions/form-2/11111111-1111-1111-1111-111111111111_private.pdf";

    assertThrows(ResourceNotFoundException.class, () -> service.load(key, "form-1"));

    verifyNoInteractions(storage);
  }
}
