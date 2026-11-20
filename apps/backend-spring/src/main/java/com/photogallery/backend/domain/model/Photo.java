package com.photogallery.backend.domain.model;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Domain model representing a photo in the gallery.
 *
 * <p>This is a framework-agnostic record used as the canonical in-memory
 * representation inside the domain layer. Persistence concerns (JPA
 * annotations, column converters) live on {@code PhotoEntity} in the
 * infrastructure layer.</p>
 *
 * <p>The {@code id} is exposed as a {@link String} to stay compatible with the
 * NestJS reference backend's JSON payload.</p>
 */
public record Photo(
        String id,
        String filename,
        String storedFilename,
        String url,
        long size,
        List<String> tags,
        Instant createdAt
) {
    public Photo {
        Objects.requireNonNull(filename, "filename");
        Objects.requireNonNull(storedFilename, "storedFilename");
        Objects.requireNonNull(url, "url");
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
