package com.photogallery.backend.infrastructure.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a photo row in the SQLite database.
 *
 * <p>The {@code tags} column is stored as a JSON string to mirror the NestJS
 * reference backend's {@code simple-json} column, which keeps the lab-103 N+1
 * debugging scenario focused on entity associations rather than collection
 * mapping quirks.</p>
 */
@Entity
@Table(name = "photos")
public class PhotoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "stored_filename", nullable = false, unique = true)
    private String storedFilename;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private long size;

    @Convert(converter = StringListJsonConverter.class)
    @Column(nullable = false)
    private List<String> tags = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (tags == null) {
            tags = new ArrayList<>();
        }
    }

    // --- getters / setters ---------------------------------------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getStoredFilename() {
        return storedFilename;
    }

    public void setStoredFilename(String storedFilename) {
        this.storedFilename = storedFilename;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : new ArrayList<>(tags);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    // --- converter -----------------------------------------------------------

    /**
     * Serializes a {@code List<String>} as a JSON array in a single SQLite
     * column. Mirrors the TypeORM {@code simple-json} behaviour used by the
     * NestJS backend.
     */
    @Converter
    public static class StringListJsonConverter implements AttributeConverter<List<String>, String> {

        private static final ObjectMapper MAPPER = new ObjectMapper();
        private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

        @Override
        public String convertToDatabaseColumn(List<String> attribute) {
            try {
                return MAPPER.writeValueAsString(attribute == null ? List.of() : attribute);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to serialize tags", e);
            }
        }

        @Override
        public List<String> convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.isBlank()) {
                return new ArrayList<>();
            }
            try {
                return MAPPER.readValue(dbData, TYPE);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to deserialize tags", e);
            }
        }
    }
}
