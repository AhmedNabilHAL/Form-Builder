package com.aiagentictask.form_builder_api.service.storage;

/**
 * A loaded file: raw bytes plus the metadata needed to serve it back to a
 * client.
 *
 * @param content     the file bytes
 * @param contentType the MIME type, or {@code null} if unknown
 * @param fileName    the original (display) file name
 */
public record StoredFile(byte[] content, String contentType, String fileName) {
}
