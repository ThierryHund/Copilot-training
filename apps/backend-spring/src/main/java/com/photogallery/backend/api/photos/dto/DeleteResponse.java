package com.photogallery.backend.api.photos.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Response DTO for {@code DELETE /api/photos/:id}.
 *
 * <p>Returns {@code {"success": false}} rather than a 404 when the id does
 * not exist, matching the NestJS reference behaviour.</p>
 */
@Schema(description = "Delete result")
public record DeleteResponse(
        @Schema(example = "true") boolean success
) {
    public static DeleteResponse of(boolean success) {
        return new DeleteResponse(success);
    }
}
