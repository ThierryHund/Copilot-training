/**
 * Photo entity representing a single photo with metadata.
 * 
 * Photos are stored in LocalStorage with base64-encoded image data.
 * Each photo can have multiple tags for organization and filtering.
 */
export interface Photo {
  /** Unique identifier (UUID v4) */
  id: string;
  
  /** Original filename from upload */
  filename: string;
  
  /** Base64-encoded image data URL (format: data:image/[type];base64,[data]) */
  dataUrl: string;
  
  /** Upload timestamp */
  uploadedAt: Date;
  
  /** Array of tags (lowercase, hyphen-separated) */
  tags: string[];
  
  /** File size in bytes */
  size: number;
}

/**
 * Validation result for photo operations.
 */
export interface PhotoValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Error message if validation failed */
  error?: string;
}

/**
 * Constants for photo validation.
 */
export const PhotoConstraints = {
  /** Maximum file size (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  /** Allowed image MIME types */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  /** Maximum filename length */
  MAX_FILENAME_LENGTH: 255,
  
  /** Maximum number of tags per photo */
  MAX_TAGS: 20,
  
  /** Maximum tag length */
  MAX_TAG_LENGTH: 30,
  
  /** Tag validation pattern (lowercase alphanumeric with hyphens) */
  TAG_PATTERN: /^[a-z0-9-]+$/,
} as const;

/**
 * Validates a file for photo upload.
 * 
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validatePhotoFile(file: File): PhotoValidationResult {
  // Check file size
  if (file.size > PhotoConstraints.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${PhotoConstraints.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }
  
  // Check file type
  if (!(PhotoConstraints.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: 'File type must be JPEG, PNG, GIF, or WebP',
    };
  }
  
  // Check filename length
  if (file.name.length > PhotoConstraints.MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `Filename exceeds ${PhotoConstraints.MAX_FILENAME_LENGTH} characters`,
    };
  }
  
  return { valid: true };
}

/**
 * Validates a tag string.
 * 
 * @param tag - The tag to validate
 * @returns Validation result with error message if invalid
 */
export function validateTag(tag: string): PhotoValidationResult {
  if (tag.length < 2) {
    return {
      valid: false,
      error: 'Tag must be at least 2 characters',
    };
  }
  
  if (tag.length > PhotoConstraints.MAX_TAG_LENGTH) {
    return {
      valid: false,
      error: `Tag exceeds ${PhotoConstraints.MAX_TAG_LENGTH} characters`,
    };
  }
  
  if (!PhotoConstraints.TAG_PATTERN.test(tag)) {
    return {
      valid: false,
      error: 'Tag must contain only lowercase letters, numbers, and hyphens',
    };
  }
  
  return { valid: true };
}

/**
 * Validates an array of tags.
 * 
 * @param tags - The tags to validate
 * @returns Validation result with error message if invalid
 */
export function validateTags(tags: string[]): PhotoValidationResult {
  if (tags.length > PhotoConstraints.MAX_TAGS) {
    return {
      valid: false,
      error: `Cannot exceed ${PhotoConstraints.MAX_TAGS} tags per photo`,
    };
  }
  
  for (const tag of tags) {
    const result = validateTag(tag);
    if (!result.valid) {
      return result;
    }
  }
  
  // Check for duplicates
  const uniqueTags = new Set(tags);
  if (uniqueTags.size !== tags.length) {
    return {
      valid: false,
      error: 'Duplicate tags are not allowed',
    };
  }
  
  return { valid: true };
}
