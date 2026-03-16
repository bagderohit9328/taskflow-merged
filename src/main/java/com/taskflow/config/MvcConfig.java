package com.taskflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    /**
     * Serve static files from classpath:/static/
     * Spring Boot does this automatically, but we also
     * add a resource handler for /uploads/ (user-uploaded files).
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded task files from the filesystem
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");

        // Frontend static assets (CSS, JS, HTML pages)
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
    }

    /**
     * Redirect bare "/" to the login page.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/", "/index.html");
    }
}
