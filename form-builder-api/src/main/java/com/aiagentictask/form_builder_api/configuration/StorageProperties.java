package com.aiagentictask.form_builder_api.configuration;

import java.util.List;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.storage.*} properties for submission file uploads. In the
 * {@code prod} profile files are persisted to Google Cloud Storage; other
 * profiles fall back to the local filesystem so development and tests need no
 * bucket or credentials.
 */
@ConfigurationProperties(prefix = "app.storage")
@Data
public class StorageProperties {

  /**
   * Target GCS bucket. Required in the prod profile; supplied via the
   * GCS_BUCKET_NAME environment variable.
   */
  private String bucketName;

  /**
   * Optional service-account JSON. When blank, Application Default Credentials
   * are used (the Cloud Run service account). Set GOOGLE_CREDENTIALS_JSON to run
   * outside Google Cloud.
   */
  private String credentialsJson;

  /** Object-name prefix used to namespace submission uploads in the bucket. */
  private String objectPrefix = "submissions";

  /** Directory used by the local (non-prod) storage backend. */
  private String localDir = "uploads";

  /** Maximum accepted file size in bytes (default 10 MB). */
  private long maxFileSizeBytes = 10L * 1024 * 1024;

  /** Allowed MIME types. An empty list allows any type. */
  private List<String> allowedContentTypes = List.of(
      "image/png",
      "image/jpeg",
      "application/pdf");
}
