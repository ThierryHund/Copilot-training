import { ApiProperty } from '@nestjs/swagger';

/**
 * Photo entity interface
 * Streamlined to only include fields actually used by the frontend
 */
export class Photo {
  @ApiProperty({ example: '1', description: 'Photo identifier' })
  id!: string;

  @ApiProperty({ example: 'holiday.jpg', description: 'Original filename for display' })
  filename!: string;

  @ApiProperty({
    example: '1700000000000-123456789.jpg',
    description: 'Unique filename on disk',
  })
  storedFilename!: string;

  @ApiProperty({
    example: '/uploads/1700000000000-123456789.jpg',
    description: 'URL to serve the file',
  })
  url!: string;

  @ApiProperty({ example: 245678, description: 'File size in bytes' })
  size!: number;

  @ApiProperty({
    type: [String],
    example: ['vacation', 'beach'],
    description: 'Tags associated with the photo',
  })
  tags!: string[];

  @ApiProperty({ type: String, format: 'date-time', description: 'Creation timestamp' })
  createdAt!: Date;
}
