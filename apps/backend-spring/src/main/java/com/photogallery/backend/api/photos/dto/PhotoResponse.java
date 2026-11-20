package com.photogallery.backend.api.photos.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.photogallery.backend.domain.model.Photo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for a photo.
 *
 * <p>Field names and types mirror the NestJS reference backend exactly so the
 * Angular frontend can switch between backends without code changes.</p>
 */
@Schema(description = "Photo metadata returned by the API")
public record PhotoResponse(
        @Schema(example = "1", description = "Photo identifier (string, not number)")
        String id,

        @Schema(example = "holiday.jpg", description = "Original filename for display")
        String filename,

        @Schema(example = "1700000000000-123456789.jpg", description = "Unique filename on disk")
        String storedFilename,

        @Schema(example = "/uploads/1700000000000-123456789.jpg", description = "URL to serve the file")
        String url,

        @Schema(example = "245678", description = "File size in bytes")
        long size,

        @Schema(example = "[\"vacation\",\"beach\"]", description = "Tags associated with the photo")
        List<String> tags,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
        @Schema(example = "2026-04-17T12:00:00.000Z", description = "Creation timestamp (ISO 8601)")
        Instant createdAt
) {
    public static PhotoResponse from(Photo photo) {
        return new PhotoResponse(
                photo.id(),
                photo.filename(),
                photo.storedFilename(),
                photo.url(),
                photo.size(),
                photo.tags(),
                photo.createdAt()
        );
    }
}
