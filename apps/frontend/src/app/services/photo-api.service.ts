import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiPhoto } from '../models/api-photo.model';

/**
 * Photo API Service
 *
 * Handles HTTP communication with the backend photo API.
 * Uses multipart/form-data for file uploads.
 */
@Injectable({ providedIn: 'root' })
export class PhotoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/photos';

  /**
   * Upload a photo to the server
   * @param file - The image file to upload
   * @param tags - Array of tags for categorization
   * @returns Observable of the created photo
   */
  uploadPhoto(file: File, tags: string[]): Observable<ApiPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    return this.http.post<ApiPhoto>(`${this.baseUrl}/upload`, formData);
  }

  /**
   * Get all photos from the server
   * @returns Observable of photo array
   */
  getPhotos(): Observable<ApiPhoto[]> {
    return this.http.get<ApiPhoto[]>(this.baseUrl);
  }

  /**
   * Get a photo by ID
   * @param id - The photo identifier
   * @returns Observable of the photo
   */
  getPhotoById(id: string): Observable<ApiPhoto> {
    return this.http.get<ApiPhoto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Delete a photo
   * @param id - The photo identifier
   * @returns Observable of success status
   */
  deletePhoto(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }
}
