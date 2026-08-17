package com.aiagentictask.form_builder_api.configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Wires storage configuration. {@link StorageProperties} is bound for every
 * profile (so upload validation and the local backend can read limits), while
 * the Google Cloud Storage {@link Storage} client is created only in the
 * {@code prod} profile. The bucket name is validated eagerly so a
 * misconfigured deployment fails fast at startup.
 */
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
@Slf4j
public class StorageConfig {

  @Bean
  @Profile("prod")
  public Storage storage(StorageProperties properties) throws IOException {
    if (properties.getBucketName() == null || properties.getBucketName().isBlank()) {
      throw new IllegalStateException(
          "GCS bucket name is missing. Set the GCS_BUCKET_NAME environment variable (app.storage.bucket-name).");
    }

    StorageOptions.Builder builder = StorageOptions.newBuilder();

    String credentialsJson = properties.getCredentialsJson();
    if (credentialsJson != null && !credentialsJson.isBlank()) {
      try (InputStream stream = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))) {
        builder.setCredentials(GoogleCredentials.fromStream(stream));
      }
      log.info("Initialized GCS client with explicit service-account credentials (bucket={})",
          properties.getBucketName());
    } else {
      log.info("Initialized GCS client with Application Default Credentials (bucket={})",
          properties.getBucketName());
    }

    return builder.build().getService();
  }
}
