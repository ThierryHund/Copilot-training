import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { PhotosModule } from '../api/photos/photos.module';
import { PhotoEntity } from '../domain/entities/photo.entity';

const DB_DIR = join(process.cwd(), 'dist', 'db');
mkdirSync(DB_DIR, { recursive: true }); // sql.js does not create the folder

/**
 * Root Application Module
 *
 * The main entry point for the NestJS application.
 * Imports all feature modules including the PhotosModule
 * which provides photo management capabilities.
 *
 * TypeORM is configured to use SQLite (sql.js, pure WASM) for persistent storage.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: join(DB_DIR, 'photogallery.db'),
      autoSave: true, // sql.js is in-memory: write the file on every change
      entities: [PhotoEntity],
      synchronize: true, // Auto-create tables (dev only)
    }),
    PhotosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
