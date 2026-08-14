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