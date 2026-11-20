import { Photo } from './photo.model';

/**
 * API response shape - matches backend Photo entity
 * Streamlined to only include fields actually used by the frontend
 */
export interface ApiPhoto {
  id: string;
  filename: string;   // Original filename
  url: string;        // Server URL for image
  size: number;
  tags: string[];
  createdAt: string;
}

/**
 * Convert API response to frontend Photo model
 * @param apiPhoto - The photo object from API response
 * @returns Photo model for frontend display
 */
export function mapApiPhotoToPhoto(apiPhoto: ApiPhoto): Photo {
  return {
    id: apiPhoto.id,
    filename: apiPhoto.filename,
    dataUrl: apiPhoto.url,  // Use server URL for display
    uploadedAt: new Date(apiPhoto.createdAt),
    tags: apiPhoto.tags,
    size: apiPhoto.size,
  };
}
