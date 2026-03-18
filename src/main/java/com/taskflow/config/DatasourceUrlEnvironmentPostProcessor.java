package com.taskflow.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Render Postgres provides connection strings like:
 *   postgresql://user:pass@host:port/db
 * Spring expects JDBC URLs:
 *   jdbc:postgresql://user:pass@host:port/db
 */
public class DatasourceUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String SOURCE_NAME = "renderDatasourceUrlFixup";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null) return;

        String trimmed = url.trim();
        String fixed = null;

        if (trimmed.startsWith("postgresql://")) {
            fixed = "jdbc:" + trimmed;
        } else if (trimmed.startsWith("postgres://")) {
            fixed = "jdbc:postgresql://" + trimmed.substring("postgres://".length());
        }

        if (fixed == null) return;

        Map<String, Object> map = new HashMap<>();
        map.put("spring.datasource.url", fixed);
        // Put first so it wins over existing sources:
        environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, map));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

