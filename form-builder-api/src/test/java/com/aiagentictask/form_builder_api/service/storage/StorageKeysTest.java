package com.aiagentictask.form_builder_api.service.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StorageKeysTest {

  @Test
  void buildsFormScopedKeyAndPreservesDisplayName() {
    String key = StorageKeys.objectKey("submissions", "form-1", "../report.pdf");

    assertTrue(key.startsWith("submissions/form-1/"));
    assertEquals(".._report.pdf", StorageKeys.deriveFileName(key));
    assertTrue(StorageKeys.belongsToForm(key, "submissions", "form-1"));
    assertFalse(StorageKeys.belongsToForm(key, "submissions", "form-2"));
  }

  @Test
  void fallsBackToSafeFileName() {
    String key = StorageKeys.objectKey("submissions", "form-1", "..");

    assertEquals("file", StorageKeys.deriveFileName(key));
  }
}
