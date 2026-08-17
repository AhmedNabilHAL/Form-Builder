package com.aiagentictask.form_builder_api.service.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Persists submission file uploads to durable storage. Implementations return
 * an
 * opaque storage key that is saved with the submission and later used to
 * retrieve the file.
 */
public interface FileStorageService {

  /**
   * Stores {@code file} for the given form and returns an opaque storage key.
   *
   * @param file   the uploaded file (must be non-empty; validated by the caller)
   * @param formId the owning form id, used to namespace the stored object
   * @return the storage key to persist with the submission
   */
  String store(MultipartFile file, String formId);

  /**
   * Loads a previously stored file by its storage key.
   *
   * @param storageKey the key returned by {@link #store(MultipartFile, String)}
   * @param formId     the owning form id, used to verify that the key is scoped
   *                   to the requested form
   * @return the file content and metadata
   */
  StoredFile load(String storageKey, String formId);

  /**
   * Deletes a previously stored file. Used to roll back uploads when persisting
   * the submission fails.
   */
  void delete(String storageKey, String formId);
}
