import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller';
import { DomainModule } from '../../domain/domain.module';

/**
 * Photos Module
 *
 * API module for photo-related endpoints.
 * Imports the DomainModule to access PhotoService.
 */
@Module({
  imports: [DomainModule],
  controllers: [PhotosController],
})
export class PhotosModule {}
