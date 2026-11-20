package com.photogallery.backend.api.photos;

import com.photogallery.backend.api.photos.dto.DeleteResponse;
import com.photogallery.backend.api.photos.dto.PhotoResponse;
import com.photogallery.backend.domain.model.Photo;
import com.photogallery.backend.domain.service.PhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller exposing the Photo Gallery HTTP API under {@code /api/photos}.
 *
 * <p>Endpoints mirror the NestJS reference backend exactly so the Angular
 * frontend can swap backends without changes. See {@code docs/openapi.yaml}
 * for the canonical contract.</p>
 */
@RestController
@RequestMapping("/api/photos")
@Tag(name = "photos", description = "Photo upload, retrieval, and management")
public class PhotosController {

    private final PhotoService photoService;

    public PhotosController(PhotoService photoService) {
        this.photoService = photoService;
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(operationId = "uploadPhoto", summary = "Upload a new photo")
    @ApiResponse(responseCode = "201", description = "Photo uploaded",
            content = @Content(schema = @Schema(implementation = PhotoResponse.class)))
    @ApiResponse(responseCode = "400", description = "File too large or invalid type")
    public PhotoResponse uploadPhoto(
            @RequestBody(
                    description = "Image file (JPEG, PNG, GIF, or WebP; max 5MB)",
                    required = true,
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)
            )
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tags", required = false) String tags
    ) {
        List<String> tagList = parseTags(tags);
        Photo photo = photoService.uploadPhoto(file, tagList);
        return PhotoResponse.from(photo);
    }

    @GetMapping
    @Operation(operationId = "getPhotos", summary = "List all photos")
    @ApiResponse(responseCode = "200", description = "Photos retrieved")
    public List<PhotoResponse> getPhotos() {
        return photoService.getPhotos().stream().map(PhotoResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getPhotoById", summary = "Get a photo by ID")
    @ApiResponse(responseCode = "200", description = "Photo retrieved (null body if not found)")
    public PhotoResponse getPhotoById(
            @Parameter(description = "Photo identifier", example = "1")
            @PathVariable String id
    ) {
        Photo photo = photoService.getPhotoById(id);
        // Intentionally returns null body (HTTP 200) when not found, matching NestJS.
        return photo == null ? null : PhotoResponse.from(photo);
    }

    @PostMapping("/{id}/thumbnail")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(operationId = "generateThumbnail",
            summary = "Generate a thumbnail URL for a photo")
    @ApiResponse(responseCode = "201", description = "Thumbnail URL",
            content = @Content(schema = @Schema(type = "string",
                    example = "/uploads/1700000000000-123456789.jpg?w=150&h=150")))
    public String generateThumbnail(
            @Parameter(description = "Photo identifier", example = "1")
            @PathVariable String id,
            @Parameter(description = "Thumbnail width", example = "150")
            @RequestParam(value = "width", required = false) Integer width,
            @Parameter(description = "Thumbnail height", example = "150")
            @RequestParam(value = "height", required = false) Integer height
    ) {
        return photoService.generateThumbnail(id, width, height);
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deletePhoto", summary = "Delete a photo")
    @ApiResponse(responseCode = "200", description = "Delete result",
            content = @Content(schema = @Schema(implementation = DeleteResponse.class)))
    public DeleteResponse deletePhoto(
            @Parameter(description = "Photo identifier", example = "1")
            @PathVariable String id
    ) {
        boolean deleted = photoService.deletePhoto(id);
        return DeleteResponse.of(deleted);
    }

    // --- helpers -------------------------------------------------------------

    private static List<String> parseTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
