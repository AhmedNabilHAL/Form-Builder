package com.aiagentictask.form_builder_api.exception;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleNotFound(
                        ResourceNotFoundException ex) {
                log.error(ex.getMessage());
                return org.springframework.http.ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 404,
                                                "error", "Not Found",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleValidation(
                        MethodArgumentNotValidException ex) {
                String message = ex.getBindingResult().getFieldErrors().stream()
                                .map(this::formatFieldError)
                                .collect(Collectors.joining("; "));
                log.warn("Validation failed: {}", message);
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", message));
        }

        @ExceptionHandler(InvalidFileException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleInvalidFile(
                        InvalidFileException ex) {
                log.warn("Invalid file upload: {}", ex.getMessage());
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(InvalidSubmissionException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleInvalidSubmission(
                        InvalidSubmissionException ex) {
                log.warn("Invalid submission: {}", ex.getMessage());
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleMaxUploadSize(
                        MaxUploadSizeExceededException ex) {
                log.warn("Upload exceeded the maximum allowed size");
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", "Uploaded file exceeds the maximum allowed size"));
        }

        @ExceptionHandler(FormGenerationException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleFormGeneration(
                        FormGenerationException ex) {
                log.error(ex.getMessage(), ex);
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 502,
                                                "error", "Bad Gateway",
                                                "message", ex.getMessage()));
        }

        @ExceptionHandler(AgentException.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleAgent(
                        AgentException ex) {
                log.error(ex.getMessage(), ex);
                return org.springframework.http.ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 502,
                                                "error", "Bad Gateway",
                                                "message", ex.getMessage()));
        }

        private String formatFieldError(FieldError error) {
                String detail = error.getDefaultMessage() == null ? "is invalid" : error.getDefaultMessage();
                return error.getField() + " " + detail;
        }

        @ExceptionHandler(Exception.class)
        public org.springframework.http.ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
                log.error(ex.getMessage());
                return org.springframework.http.ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of(
                                                "timestamp", Instant.now().toString(),
                                                "status", 500,
                                                "error", "Internal Server Error",
                                                "message", ex.getMessage()));
        }
}
