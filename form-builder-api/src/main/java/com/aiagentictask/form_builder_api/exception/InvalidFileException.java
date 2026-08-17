package com.aiagentictask.form_builder_api.exception;

/** Thrown when an uploaded file violates size or content-type constraints. */
public class InvalidFileException extends RuntimeException {

  public InvalidFileException(String message) {
    super(message);
  }
}
