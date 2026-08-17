package com.aiagentictask.form_builder_api.service.storage;

import java.util.HashMap;
import java.util.Map;

import com.aiagentictask.form_builder_api.configuration.StorageProperties;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Google Cloud Storage backend used in the {@code prod} profile. Objects are
 * stored under {@code <prefix>/<formId>/<uuid>_<name>} and are private; files
 * are retrieved through the API rather than public URLs.
 */
@Service
@Profile("prod")
@RequiredArgsConstructor
@Slf4j
public class GcsFileStorageService implements FileStorageService {

  private static final String ORIGINAL_FILENAME_KEY = "originalFilename";

  private final Storage storage;
  private final StorageProperties properties;

  @Override
  public String store(MultipartFile file, String formId) {
    String objectName = properties.getObjectPrefix()
        + "/" + formId
        + "/" + StorageKeys.randomObjectName(file.getOriginalFilename());

    BlobId blobId = BlobId.of(properties.getBucketName(), objectName);
    Map<String, String> metadata = new HashMap<>();
    metadata.put(ORIGINAL_FILENAME_KEY, StorageKeys.sanitize(file.getOriginalFilename()));

    BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
        .setContentType(file.getContentType())
        .setMetadata(metadata)
        .build();

    try {
      storage.create(blobInfo, file.getBytes());
    } catch (Exception e) {
      throw new RuntimeException("Failed to store uploaded file in Cloud Storage", e);
    }

    log.info("Stored upload gs://{}/{}", properties.getBucketName(), objectName);
    return objectName;
  }

  @Override
  public StoredFile load(String storageKey) {
    Blob blob = storage.get(BlobId.of(properties.getBucketName(), storageKey));
    if (blob == null || !blob.exists()) {
      throw new ResourceNotFoundException("File not found: " + storageKey);
    }

    String fileName = StorageKeys.deriveFileName(storageKey);
    if (blob.getMetadata() != null && blob.getMetadata().get(ORIGINAL_FILENAME_KEY) != null) {
      fileName = blob.getMetadata().get(ORIGINAL_FILENAME_KEY);
    }

    return new StoredFile(blob.getContent(), blob.getContentType(), fileName);
  }
}
