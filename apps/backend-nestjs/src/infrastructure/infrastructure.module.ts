import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegacyStorageService } from './storage/legacy-storage.service';
import { TypeOrmPhotoRepository } from './repositories/typeorm-photo.repository';
import { PhotoEntity } from '../domain/entities/photo.entity';

/**
 * Infrastructure Module
 *
 * Contains infrastructure services for external integrations
 * such as storage, databases, and third-party APIs.
 *
 * This module now encapsulates TypeORM-specific concerns including
 * repository implementations, keeping ORM dependencies isolated
 * from the domain layer.
 *
 * The LegacyStorageService uses callback-based patterns
 * that can be refactored to modern async/await patterns
 * as part of training exercises.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity])],
  providers: [
    LegacyStorageService,
    TypeOrmPhotoRepository,
  ],
  exports: [
    LegacyStorageService,
    TypeOrmPhotoRepository,
  ],
})
export class InfrastructureModule {}
