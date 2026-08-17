package com.aiagentictask.form_builder_api.service.storage;

import java.util.UUID;

/** Helpers for building and interpreting opaque storage keys. */
final class StorageKeys {

  private StorageKeys() {
  }

  /** Builds a collision-resistant object name segment: {@code <uuid>_<name>}. */
  static String randomObjectName(String originalFilename) {
    String safeName = sanitize(originalFilename);
    return UUID.randomUUID() + "_" + safeName;
  }

  /**
   * Derives a display file name from a storage key ({@code .../<uuid>_<name>}).
   */
  static String deriveFileName(String storageKey) {
    String lastSegment = storageKey.substring(storageKey.lastIndexOf('/') + 1);
    return lastSegment.replaceFirst("(?i)^[0-9a-f-]{36}_", "");
  }

  /** Strips path separators and trims to keep stored names safe. */
  static String sanitize(String originalFilename) {
    if (originalFilename == null || originalFilename.isBlank()) {
      return "file";
    }
    String name = originalFilename.replaceAll("[\\\\/]+", "_").trim();
    return name.isEmpty() ? "file" : name;
  }
}
