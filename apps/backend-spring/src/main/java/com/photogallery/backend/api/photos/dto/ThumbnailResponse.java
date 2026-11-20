package com.photogallery.backend.api.photos.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Thumbnail URL wrapper used <em>only</em> in the OpenAPI schema.
 *
 * <p>The actual HTTP response for {@code POST /api/photos/:id/thumbnail} is a
 * plain JSON string (no wrapper object), matching the NestJS reference
 * implementation. This record exists so OpenAPI can reference a stable
 * schema name if generators need one.</p>
 */
@Schema(description = "Thumbnail URL (returned as a plain JSON string, not an object)")
public record ThumbnailResponse(
        @Schema(example = "/uploads/1700000000000-123456789.jpg?w=150&h=150")
        String url
) {
}
