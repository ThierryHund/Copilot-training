import { Test, TestingModule } from '@nestjs/testing';
import { LegacyStorageService } from './legacy-storage.service';

describe('LegacyStorageService', () => {
  let service: LegacyStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegacyStorageService],
    }).compile();

    service = module.get<LegacyStorageService>(LegacyStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
