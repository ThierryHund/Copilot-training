package com.photogallery.backend.domain.repository;

import com.photogallery.backend.infrastructure.entity.PhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link PhotoEntity}.
 *
 * <p>Placed in the domain layer because it is the port through which the
 * domain service talks to persistence. The implementing JPA proxy lives in
 * the infrastructure layer at runtime.</p>
 */
@Repository
public interface PhotoRepository extends JpaRepository<PhotoEntity, Long> {

    /**
     * List all photos ordered by creation date descending (newest first),
     * matching the NestJS reference backend.
     */
    List<PhotoEntity> findAllByOrderByCreatedAtDesc();
}
