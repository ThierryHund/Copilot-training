import { Module } from '@nestjs/common';
import { PhotoService } from './services/photo.service';
import { PHOTO_REPOSITORY } from './repositories/photo.repository.interface';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { TypeOrmPhotoRepository } from '../infrastructure/repositories/typeorm-photo.repository';

/**
 * Domain Module
 *
 * Contains domain services that implement business logic.
 * This layer orchestrates operations between the API layer
 * and the infrastructure layer.
 *
 * The PhotoRepository interface is provided by the TypeORM implementation
 * from the infrastructure module, following the Dependency Inversion Principle.
 * This allows the domain layer to remain independent of specific ORM choices.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    PhotoService,
    {
      provide: PHOTO_REPOSITORY,
      useExisting: TypeOrmPhotoRepository,
    },
  ],
  exports: [PhotoService],
})
export class DomainModule {}
