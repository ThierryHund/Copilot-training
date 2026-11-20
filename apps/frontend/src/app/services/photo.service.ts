import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Photo, validateTags } from '../models/photo.model';
import { TagStats } from '../models/tag.model';
import { PhotoApiService } from './photo-api.service';
import { mapApiPhotoToPhoto } from '../models/api-photo.model';

/**
 * Storage key for LocalStorage persistence (fallback).
 */
const STORAGE_KEY = 'photo-gallery:photos';

/**
 * Service for managing photo gallery data with signal-based state management.
 *
 * Provides reactive state updates using Angular signals.
 * Primary storage is backend API, with LocalStorage as fallback.
 *
 * @example
 * ```typescript
 * const photoService = inject(PhotoService);
 *
 * // Upload a photo
 * await photoService.uploadPhoto(file, tags);
 *
 * // Access photos reactively
 * const photos = photoService.photos();
 *
 * // Get tag statistics
 * const tags = photoService.tagStats();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly apiService = inject(PhotoApiService);

  /**
   * Signal containing all photos.
   */
  private readonly photosSignal = signal<Photo[]>([]);

  /**
   * Signal indicating loading state.
   */
  private readonly loadingSignal = signal<boolean>(false);

  /**
   * Public read-only accessor for photos.
   */
  readonly photos = this.photosSignal.asReadonly();

  /**
   * Public read-only accessor for loading state.
   */
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Computed signal providing tag statistics.
   * Automatically recalculates when photos change.
   */
  readonly tagStats = computed(() => {
    const tagMap = new Map<string, number>();

    for (const photo of this.photosSignal()) {
      for (const tag of photo.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagMap.entries())
      .map(([name, count]): TagStats => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  constructor() {
    this.loadFromApi();
  }

  /**
   * Loads photos from the API.
   * Falls back to LocalStorage if API is unavailable.
   */
  private async loadFromApi(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const apiPhotos = await firstValueFrom(this.apiService.getPhotos());
      const photos = apiPhotos.map(mapApiPhotoToPhoto);
      this.photosSignal.set(photos);
    } catch (error) {
      console.warn('API unavailable, loading from localStorage:', error);
      this.loadFromStorage();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Uploads a new photo to the server.
   *
   * @param file - The image file to upload
   * @param tags - Array of tags for categorization
   * @throws Error if upload fails
   */
  async uploadPhoto(file: File, tags: string[]): Promise<void> {
    // Validate tags
    const tagValidation = validateTags(tags);
    if (!tagValidation.valid) {
      throw new Error(tagValidation.error);
    }

    const apiPhoto = await firstValueFrom(
      this.apiService.uploadPhoto(file, tags)
    );
    const photo = mapApiPhotoToPhoto(apiPhoto);
    this.photosSignal.update((photos) => [...photos, photo]);
  }

  /**
   * Removes a photo from the server.
   *
   * @param photoId - The ID of the photo to remove
   * @throws Error if deletion fails
   */
  async removePhoto(photoId: string): Promise<void> {
    const result = await firstValueFrom(this.apiService.deletePhoto(photoId));
    if (result.success) {
      this.photosSignal.update((photos) =>
        photos.filter((p) => p.id !== photoId)
      );
    } else {
      throw new Error('Failed to delete photo');
    }
  }

  /**
   * Updates tags for a specific photo.
   *
   * @param photoId - The ID of the photo to update
   * @param tags - The new tags array
   * @throws Error if photo not found or tag validation fails
   */
  updatePhotoTags(photoId: string, tags: string[]): void {
    const tagValidation = validateTags(tags);
    if (!tagValidation.valid) {
      throw new Error(tagValidation.error);
    }

    const currentPhotos = this.photosSignal();
    const photoIndex = currentPhotos.findIndex((p) => p.id === photoId);

    if (photoIndex === -1) {
      throw new Error(`Photo with ID ${photoId} not found`);
    }

    const updatedPhotos = [...currentPhotos];
    updatedPhotos[photoIndex] = {
      ...updatedPhotos[photoIndex],
      tags,
    };

    this.photosSignal.set(updatedPhotos);
  }

  /**
   * Filters photos by tags (photos must have ALL specified tags).
   *
   * @param tags - Array of tags to filter by
   * @returns Computed signal with filtered photos
   */
  filterByTags(tags: string[]) {
    return computed(() => {
      if (tags.length === 0) {
        return this.photosSignal();
      }

      return this.photosSignal().filter((photo) =>
        tags.every((tag) => photo.tags.includes(tag))
      );
    });
  }

  /**
   * Loads photos from LocalStorage (fallback).
   * Handles corrupt data gracefully by initializing empty array.
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);

      // Convert date strings back to Date objects
      const photos: Photo[] = parsed.map((p: Photo) => ({
        ...p,
        uploadedAt: new Date(p.uploadedAt),
      }));

      this.photosSignal.set(photos);
    } catch (error) {
      console.error('Failed to load photos from storage:', error);
      this.photosSignal.set([]);
    }
  }

  /**
   * Clears all photos from the collection.
   * Use with caution - this action cannot be undone.
   */
  clearAll(): void {
    this.photosSignal.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }
}
