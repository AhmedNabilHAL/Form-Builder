package com.aiagentictask.form_builder_api.service.storage;

import java.util.UUID;

/** Helpers for building and interpreting opaque storage keys. */
final class StorageKeys {

  private StorageKeys() {
  }

  /**
   * Builds an object key scoped to a form:
   * {@code <prefix>/<formId>/<uuid>_<name>}.
   */
  static String objectKey(String prefix, String formId, String originalFilename) {
    return formPrefix(prefix, formId) + "/" + randomObjectName(originalFilename);
  }

  /** Returns whether a storage key belongs to the supplied form namespace. */
  static boolean belongsToForm(String storageKey, String prefix, String formId) {
    return storageKey != null && storageKey.startsWith(formPrefix(prefix, formId) + "/");
  }

  private static String formPrefix(String prefix, String formId) {
    String safePrefix = sanitizePathSegment(prefix, "submissions");
    String safeFormId = sanitizePathSegment(formId, "unknown-form");
    return safePrefix + "/" + safeFormId;
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
    String name = originalFilename
        .replaceAll("[\\p{Cntrl}\\\\/]+", "_")
        .trim();
    if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
      return "file";
    }
    return name.length() > 180 ? name.substring(0, 180) : name;
  }

  private static String sanitizePathSegment(String value, String fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    String sanitized = value
        .replaceAll("[\\p{Cntrl}\\\\/]+", "_")
        .replace("..", "_")
        .trim();
    return sanitized.isEmpty() ? fallback : sanitized;
  }
}
