import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PhotoService } from '../../domain/services/photo.service';
import { Photo } from '../../domain/models/photo.model';
import { UploadPhotoDto } from './dto/upload-photo';

/**
 * Multer disk storage configuration
 * Stores uploaded files in ./uploads with unique filenames
 */
const storage = diskStorage({
  destination: './dist/uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

/**
 * Photos Controller
 * Handles HTTP requests for photo-related operations
 */
@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @ApiOperation({
    operationId: 'uploadPhoto',
    summary: 'Upload a new photo',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhotoDto })
  @ApiResponse({ status: 201, description: 'Photo uploaded', type: Photo })
  @ApiResponse({ status: 400, description: 'File too large or invalid type' })
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: /image\/(jpeg|png|gif|webp)/,
            fallbackToMimetype: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('tags') tags?: string,
  ): Promise<Photo> {
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    return this.photoService.uploadPhoto(file, tagList);
  }

  @Get()
  @ApiOperation({ operationId: 'getPhotos', summary: 'List all photos' })
  @ApiResponse({ status: 200, description: 'Photos retrieved', type: [Photo] })
  async getPhotos(): Promise<Photo[]> {
    return this.photoService.getPhotos();
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getPhotoById', summary: 'Get a photo by ID' })
  @ApiParam({ name: 'id', type: String, example: '1' })
  @ApiResponse({ status: 200, description: 'Photo retrieved', type: Photo })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async getPhotoById(@Param('id') id: string): Promise<Photo | null> {
    return this.photoService.getPhotoById(id);
  }

  @Post(':id/thumbnail')
  @ApiOperation({
    operationId: 'generateThumbnail',
    summary: 'Generate a thumbnail URL for a photo',
  })
  @ApiParam({ name: 'id', type: String, example: '1' })
  @ApiQuery({ name: 'width', type: Number, required: false, example: 150 })
  @ApiQuery({ name: 'height', type: Number, required: false, example: 150 })
  @ApiResponse({
    status: 201,
    description: 'Thumbnail URL',
    schema: { type: 'string', example: '/dist/uploads/abc.jpg?w=150&h=150' },
  })
  async generateThumbnail(
    @Param('id') id: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
  ): Promise<string> {
    const w = width ? parseInt(width, 10) : undefined;
    const h = height ? parseInt(height, 10) : undefined;
    return this.photoService.generateThumbnail(id, w, h);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deletePhoto', summary: 'Delete a photo' })
  @ApiParam({ name: 'id', type: String, example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Delete result',
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
      required: ['success'],
    },
  })
  async deletePhoto(@Param('id') id: string): Promise<{ success: boolean }> {
    const deleted = await this.photoService.deletePhoto(id);
    return { success: deleted };
  }
}
