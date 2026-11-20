import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoEntity } from '../../domain/entities/photo.entity';
import { PhotoRepository } from '../../domain/repositories/photo.repository.interface';

/**
 * TypeORM Photo Repository Implementation
 *
 * Infrastructure-layer adapter implementing the PhotoRepository interface
 * using TypeORM. This isolates NestJS and TypeORM dependencies from the
 * domain layer, allowing the domain service to work with a clean interface.
 *
 * This class encapsulates all ORM-specific operations and can be easily
 * replaced with alternative implementations (e.g., MongoDB, PostgreSQL with
 * different ORM, or in-memory storage for testing).
 */
@Injectable()
export class TypeOrmPhotoRepository implements PhotoRepository {
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly repository: Repository<PhotoEntity>,
  ) {}

  /**
   * Create a new photo entity instance (not yet persisted)
   * @param data - Photo entity data without id and createdAt
   * @returns The created entity instance
   */
  async create(data: Omit<PhotoEntity, 'id' | 'createdAt'>): Promise<PhotoEntity> {
    return this.repository.create(data);
  }

  /**
   * Save a photo entity to the database
   * @param entity - The photo entity to persist
   * @returns The saved entity with id and timestamps populated
   */
  async save(entity: PhotoEntity): Promise<PhotoEntity> {
    return this.repository.save(entity);
  }

  /**
   * Find all photos with optional ordering
   * @param options - Query options including order configuration
   * @returns Array of all photo entities
   */
  async findAll(options?: { order?: Record<string, 'ASC' | 'DESC'> }): Promise<PhotoEntity[]> {
    return this.repository.find({
      order: options?.order,
    });
  }

  /**
   * Find a single photo by ID
   * @param id - The numeric photo identifier
   * @returns The photo entity or null if not found
   */
  async findById(id: number): Promise<PhotoEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Delete a photo by ID
   * @param id - The numeric photo identifier
   * @returns True if the photo was deleted, false if not found
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
