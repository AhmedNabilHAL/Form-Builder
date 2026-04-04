package com.aiagentictask.form_builder_api.configuration;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
@Getter
public class ApiProperties {

    private final Cors cors = new Cors();
    private final Security security = new Security();

    @Data
    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();
        private List<String> allowedMethods = List.of("GET", "POST", "PUT", "DELETE", "OPTIONS");
        private List<String> allowedHeaders = List.of("*");
        private boolean allowCredentials = false;
        private long maxAge = 3600;
    }

    @Data
    public static class Security {
        private boolean enableHsts = false;
        private String contentSecurityPolicy = "default-src 'self'";
        private String referrerPolicy = "strict-origin-when-cross-origin";
    }
}
