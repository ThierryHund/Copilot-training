import { Injectable, Inject } from '@nestjs/common';
import { Photo } from '../models/photo.model';
import { PhotoEntity } from '../entities/photo.entity';
import { PhotoRepository, PHOTO_REPOSITORY } from '../repositories/photo.repository.interface';

/**
 * Photo Service
 *
 * Domain service handling photo business logic including
 * thumbnail generation, storage operations, and data management.
 *
 * Now decoupled from NestJS/TypeORM by using the PhotoRepository interface,
 * following the Dependency Inversion Principle.
 */
@Injectable()
export class PhotoService {
  constructor(
    @Inject(PHOTO_REPOSITORY)
    private readonly photoRepository: PhotoRepository,
  ) {}

  /**
   * Upload a new photo
   * @param file - The Multer file object from multipart upload
   * @param tags - Optional array of tags for categorization
   * @returns The created photo object
   */
  async uploadPhoto(file: Express.Multer.File, tags: string[] = []): Promise<Photo> {
    const photoEntity = await this.photoRepository.create({
      filename: file.originalname,
      storedFilename: file.filename,
      url: `/uploads/${file.filename}`,
      size: file.size,
      tags: tags,
    });

    const saved = await this.photoRepository.save(photoEntity);
    return this.entityToPhoto(saved);
  }

  /**
   * Get all photos
   * @returns Array of all photos ordered by creation date (newest first)
   */
  async getPhotos(): Promise<Photo[]> {
    const entities = await this.photoRepository.findAll({
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => this.entityToPhoto(e));
  }

  /**
   * Get a photo by ID
   * @param id - The photo identifier
   * @returns The photo or null if not found
   */
  async getPhotoById(id: string): Promise<Photo | null> {
    const entity = await this.photoRepository.findById(Number(id));
    return entity ? this.entityToPhoto(entity) : null;
  }

  /**
   * Generate thumbnail for a photo
   *
   * This method creates a thumbnail version of the original photo.
   * In a real implementation, this would use image processing libraries
   * like Sharp or ImageMagick.
   *
   * @param photoId - The photo identifier
   * @param width - Target thumbnail width (default: 150)
   * @param height - Target thumbnail height (default: 150)
   * @returns Promise resolving to the thumbnail URL
   */
  async generateThumbnail(
    photoId: string,
    width = 150,
    height = 150
  ): Promise<string> {
    const photo = await this.getPhotoById(photoId);
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    // In a real implementation, this would:
    // 1. Retrieve the original image from storage
    // 2. Resize the image using Sharp or similar library
    // 3. Store the thumbnail
    // 4. Return the thumbnail URL

    const thumbnailUrl = `/dist/uploads/${photo.storedFilename}?w=${width}&h=${height}`;
    return thumbnailUrl;
  }

  /**
   * Delete a photo
   * @param id - The photo identifier
   * @returns True if deleted, false if not found
   */
  async deletePhoto(id: string): Promise<boolean> {
    return this.photoRepository.delete(Number(id));
  }

  /**
   * Convert TypeORM entity to Photo interface
   * @param entity - The PhotoEntity from database
   * @returns Photo interface for API response
   */
  private entityToPhoto(entity: PhotoEntity): Photo {
    return {
      id: String(entity.id),
      filename: entity.filename,
      storedFilename: entity.storedFilename,
      url: entity.url,
      size: entity.size,
      tags: entity.tags,
      createdAt: entity.createdAt,
    };
  }
}
