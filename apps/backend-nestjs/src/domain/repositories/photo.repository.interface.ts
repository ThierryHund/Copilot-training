import { PhotoEntity } from '../entities/photo.entity';

/**
 * Injection token for PhotoRepository
 * 
 * Use this symbol for dependency injection instead of magic strings.
 * Provides type safety and refactoring support.
 */
export const PHOTO_REPOSITORY = Symbol('PhotoRepository');

/**
 * PhotoRepository Interface
 *
 * Domain-level repository abstraction for photo persistence operations.
 * This interface defines the contract for photo data access without
 * coupling to specific ORM or database implementation details.
 *
 * Implementations must handle entity-to-model conversion internally,
 * ensuring the domain layer works with Photo models while the
 * infrastructure layer deals with PhotoEntity persistence.
 */
export interface PhotoRepository {
  /**
   * Create and persist a new photo entity
   * @param data - Partial photo entity data (without id and createdAt)
   * @returns The persisted photo entity
   */
  create(data: Omit<PhotoEntity, 'id' | 'createdAt'>): Promise<PhotoEntity>;

  /**
   * Save a photo entity to the database
   * @param entity - The photo entity to save
   * @returns The saved photo entity
   */
  save(entity: PhotoEntity): Promise<PhotoEntity>;

  /**
   * Find all photos
   * @param options - Query options (e.g., ordering)
   * @returns Array of all photo entities
   */
  findAll(options?: { order?: Record<string, 'ASC' | 'DESC'> }): Promise<PhotoEntity[]>;

  /**
   * Find a photo by ID
   * @param id - The photo identifier (numeric)
   * @returns The photo entity or null if not found
   */
  findById(id: number): Promise<PhotoEntity | null>;

  /**
   * Delete a photo by ID
   * @param id - The photo identifier (numeric)
   * @returns True if deleted, false if not found
   */
  delete(id: number): Promise<boolean>;
}
