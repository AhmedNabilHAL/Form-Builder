package com.aiagentictask.form_builder_api.configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(ApiProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private final ApiProperties apiProperties;

    public WebConfig(ApiProperties apiProperties) {
        this.apiProperties = apiProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(apiProperties.getCors().getAllowedOrigins().toArray(String[]::new))
                .allowedMethods(apiProperties.getCors().getAllowedMethods().toArray(String[]::new))
                .allowedHeaders(apiProperties.getCors().getAllowedHeaders().toArray(String[]::new))
                .allowCredentials(apiProperties.getCors().isAllowCredentials())
                .maxAge(apiProperties.getCors().getMaxAge());
    }
}
