package com.photogallery.backend.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded files as static resources under {@code /uploads/**}.
 *
 * <p>Maps the configured filesystem directory (default {@code ./uploads}) so
 * that {@code GET /uploads/{storedFilename}} returns the raw image bytes,
 * matching the NestJS reference backend.</p>
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private final Path uploadsDir;

    public StaticResourceConfig(@Value("${photogallery.uploads-dir:./uploads}") String uploadsDir) {
        this.uploadsDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Trailing slash on the file: location is required for Spring to treat
        // the resource path as a directory.
        String location = "file:" + uploadsDir.toString() + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
