import { ApiProperty } from '@nestjs/swagger';

/**
 * Swagger schema for the multipart/form-data body of POST /api/photos/upload.
 *
 * The controller reads the file via `@UploadedFile()` and `tags` via `@Body('tags')`.
 * This class exists only to describe the request shape in the OpenAPI spec.
 */
export class UploadPhotoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPEG, PNG, GIF, or WebP; max 5MB)',
  })
  file!: unknown;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'vacation,beach,sunset',
    description: 'Comma-separated list of tags',
  })
  tags?: string;
}
