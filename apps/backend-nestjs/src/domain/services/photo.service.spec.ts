import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { PhotoRepository, PHOTO_REPOSITORY } from '../repositories/photo.repository.interface';

describe('PhotoService', () => {
  let service: PhotoService;
  let mockPhotoRepository: Mocked<PhotoRepository>;

  beforeEach(async () => {
    // Create mock implementations
    mockPhotoRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
    } as Mocked<PhotoRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        {
          provide: PHOTO_REPOSITORY,
          useValue: mockPhotoRepository,
        },
      ],
    }).compile();

    service = module.get<PhotoService>(PhotoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
