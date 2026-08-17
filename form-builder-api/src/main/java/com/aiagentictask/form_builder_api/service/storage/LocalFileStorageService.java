package com.aiagentictask.form_builder_api.service.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import com.aiagentictask.form_builder_api.configuration.StorageProperties;
import com.aiagentictask.form_builder_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Local filesystem backend used outside the {@code prod} profile so development
 * and tests need no bucket or credentials. Files are written under the
 * configured local directory; the storage key is the generated file name.
 */
@Service
@Profile("!prod")
@RequiredArgsConstructor
@Slf4j
public class LocalFileStorageService implements FileStorageService {

  private final StorageProperties properties;

  @Override
  public String store(MultipartFile file, String formId) {
    try {
      Path uploadPath = Paths.get(properties.getLocalDir()).toAbsolutePath().normalize();
      String storageKey = StorageKeys.objectKey(
          properties.getObjectPrefix(),
          formId,
          file.getOriginalFilename());
      Path filePath = resolveOwnedPath(uploadPath, storageKey, formId);
      Files.createDirectories(filePath.getParent());
      file.transferTo(filePath);

      log.info("Stored upload {}", filePath);
      return storageKey;
    } catch (IOException e) {
      throw new RuntimeException("Failed to store uploaded file", e);
    }
  }

  @Override
  public StoredFile load(String storageKey, String formId) {
    try {
      Path uploadPath = Paths.get(properties.getLocalDir()).toAbsolutePath().normalize();
      Path filePath = resolveOwnedPath(uploadPath, storageKey, formId);
      if (!Files.isRegularFile(filePath)) {
        throw new ResourceNotFoundException("File not found: " + storageKey);
      }

      byte[] content = Files.readAllBytes(filePath);
      String contentType = Files.probeContentType(filePath);
      return new StoredFile(content, contentType, StorageKeys.deriveFileName(storageKey));
    } catch (IOException e) {
      throw new RuntimeException("Failed to read stored file", e);
    }
  }

  @Override
  public void delete(String storageKey, String formId) {
    try {
      Path uploadPath = Paths.get(properties.getLocalDir()).toAbsolutePath().normalize();
      Files.deleteIfExists(resolveOwnedPath(uploadPath, storageKey, formId));
    } catch (IOException e) {
      throw new RuntimeException("Failed to delete stored file", e);
    }
  }

  private Path resolveOwnedPath(Path uploadPath, String storageKey, String formId) {
    if (!StorageKeys.belongsToForm(storageKey, properties.getObjectPrefix(), formId)) {
      throw new ResourceNotFoundException("File not found");
    }

    Path filePath = uploadPath.resolve(storageKey).normalize();
    if (!filePath.startsWith(uploadPath)) {
      throw new ResourceNotFoundException("File not found");
    }
    return filePath;
  }
}
