package com.aiagentictask.form_builder_api.exception;

/** Thrown when a submitted answers payload cannot be safely processed. */
public class InvalidSubmissionException extends RuntimeException {

  public InvalidSubmissionException(String message, Throwable cause) {
    super(message, cause);
  }
}
