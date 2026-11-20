package com.photogallery.backend.domain.service;

import com.photogallery.backend.domain.model.Photo;
import com.photogallery.backend.domain.repository.PhotoRepository;
import com.photogallery.backend.infrastructure.entity.PhotoEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Domain service encapsulating photo management business logic.
 *
 * <p>Responsibilities:</p>
 * <ul>
 *   <li>Validate the uploaded file (size + MIME type) beyond what
 *       {@code spring.servlet.multipart} already enforces.</li>
 *   <li>Persist the file on disk under {@code ./uploads/} using a unique
 *       name derived from {@code epochMillis-random.ext}.</li>
 *   <li>Persist a Photo row via {@link PhotoRepository}.</li>
 *   <li>Translate between {@link PhotoEntity} and the domain {@link Photo}
 *       record that flows to the API layer.</li>
 * </ul>
 */
@Service
public class PhotoService {

    private static final Logger LOG = LoggerFactory.getLogger(PhotoService.class);

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private final PhotoRepository photoRepository;
    private final Path uploadsDir;

    public PhotoService(
            PhotoRepository photoRepository,
            @Value("${photogallery.uploads-dir:./uploads}") String uploadsDir
    ) {
        this.photoRepository = photoRepository;
        this.uploadsDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    /**
     * Store the uploaded file on disk and persist a {@link PhotoEntity}.
     *
     * @param file multipart file from the HTTP request
     * @param tags optional list of tags; {@code null} becomes an empty list
     * @return the created photo as a domain {@link Photo}
     * @throws IllegalArgumentException if the file is missing, too large, or of an unsupported type
     */
    @Transactional
    public Photo uploadPhoto(MultipartFile file, List<String> tags) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Unsupported file type; allowed: JPEG, PNG, GIF, WebP"
            );
        }

        try {
            Files.createDirectories(uploadsDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create uploads directory: " + uploadsDir, e);
        }

        String originalName = Optional.ofNullable(file.getOriginalFilename()).orElse("upload");
        String extension = extractExtension(originalName, contentType);
        String storedFilename = System.currentTimeMillis()
                + "-" + Math.abs(ThreadLocalRandom.current().nextInt(1_000_000_000))
                + (extension.isEmpty() ? "" : "." + extension);

        Path destination = uploadsDir.resolve(storedFilename);
        try {
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write uploaded file", e);
        }

        PhotoEntity entity = new PhotoEntity();
        entity.setFilename(originalName);
        entity.setStoredFilename(storedFilename);
        entity.setUrl("/uploads/" + storedFilename);
        entity.setSize(file.getSize());
        entity.setTags(tags == null ? List.of() : tags);

        PhotoEntity saved = photoRepository.save(entity);
        LOG.info("Uploaded photo id={} filename={} size={}", saved.getId(), saved.getFilename(), saved.getSize());
        return toDomain(saved);
    }

    /**
     * @return all photos ordered by creation date descending
     */
    @Transactional(readOnly = true)
    public List<Photo> getPhotos() {
        return photoRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDomain)
                .toList();
    }

    /**
     * @return the photo with the given id, or {@code null} if not found
     */
    @Transactional(readOnly = true)
    public Photo getPhotoById(String id) {
        Long numericId = parseIdOrNull(id);
        if (numericId == null) {
            return null;
        }
        return photoRepository.findById(numericId).map(this::toDomain).orElse(null);
    }

    /**
     * Generate a thumbnail URL for a photo.
     *
     * <p>Mirrors the NestJS stub: it does not actually resize the image — it
     * simply returns a URL string that the frontend can treat as a thumbnail
     * source. A real implementation would invoke an image library (e.g.
     * imgscalr or Thumbnailator) and persist the resulting file.</p>
     *
     * @throws IllegalStateException if the photo does not exist (matches
     *                               NestJS which throws and surfaces a 500)
     */
    @Transactional(readOnly = true)
    public String generateThumbnail(String id, Integer width, Integer height) {
        Photo photo = getPhotoById(id);
        if (photo == null) {
            throw new IllegalStateException("Photo not found: " + id);
        }
        int w = width == null ? 150 : width;
        int h = height == null ? 150 : height;
        return "/uploads/" + photo.storedFilename() + "?w=" + w + "&h=" + h;
    }

    /**
     * Delete a photo by id.
     *
     * @return {@code true} if a row was deleted, {@code false} if the id did not exist
     */
    @Transactional
    public boolean deletePhoto(String id) {
        Long numericId = parseIdOrNull(id);
        if (numericId == null || !photoRepository.existsById(numericId)) {
            return false;
        }
        photoRepository.deleteById(numericId);
        return true;
    }

    // --- helpers -------------------------------------------------------------

    private Long parseIdOrNull(String id) {
        if (id == null) {
            return null;
        }
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractExtension(String originalName, String contentType) {
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0 && dot < originalName.length() - 1) {
            return originalName.substring(dot + 1).toLowerCase();
        }
        // Fall back to the MIME subtype (e.g. image/jpeg -> jpeg, image/webp -> webp).
        if (contentType != null && contentType.startsWith("image/")) {
            return contentType.substring("image/".length());
        }
        return "";
    }

    private Photo toDomain(PhotoEntity entity) {
        return new Photo(
                String.valueOf(entity.getId()),
                entity.getFilename(),
                entity.getStoredFilename(),
                entity.getUrl(),
                entity.getSize(),
                entity.getTags(),
                entity.getCreatedAt()
        );
    }
}
