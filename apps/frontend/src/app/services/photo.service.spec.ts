import { TestBed } from '@angular/core/testing';
import { PhotoService } from './photo.service';
import { Photo } from '../models/photo.model';

describe('PhotoService', () => {
  let service: PhotoService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    global.Storage.prototype.getItem = vi.fn((key: string) => mockLocalStorage[key] || null);
    global.Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    global.Storage.prototype.removeItem = vi.fn((key: string) => {
      delete mockLocalStorage[key];
    });
    global.Storage.prototype.clear = vi.fn(() => {
      mockLocalStorage = {};
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addPhoto', () => {
    it('should add a photo to the collection', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);

      expect(service.photos()).toHaveLength(1);
      expect(service.photos()[0]).toEqual(photo);
    });

    it('should persist photo to localStorage', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);

      expect(localStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage['photo-gallery:photos']).toBeDefined();
    });

    it('should throw error for invalid tags', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['X'], // Too short
        size: 1000,
      };

      expect(() => service.addPhoto(photo)).toThrow('Tag must be at least 2 characters');
    });

    it('should throw error for too many tags', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: Array(21).fill('tag').map((t, i) => `${t}-${i}`), // 21 tags (max is 20)
        size: 1000,
      };

      expect(() => service.addPhoto(photo)).toThrow('Cannot exceed 20 tags per photo');
    });
  });

  describe('removePhoto', () => {
    it('should remove a photo from the collection', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);
      expect(service.photos()).toHaveLength(1);

      service.removePhoto('1');
      expect(service.photos()).toHaveLength(0);
    });

    it('should throw error if photo not found', () => {
      expect(() => service.removePhoto('nonexistent')).toThrow('Photo with ID nonexistent not found');
    });

    it('should persist changes after removal', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);
      service.removePhoto('1');

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updatePhotoTags', () => {
    it('should update tags for a photo', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['old-tag'],
        size: 1000,
      };

      service.addPhoto(photo);
      service.updatePhotoTags('1', ['new-tag', 'another-tag']);

      expect(service.photos()[0].tags).toEqual(['new-tag', 'another-tag']);
    });

    it('should throw error for invalid tags', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);

      expect(() => service.updatePhotoTags('1', ['INVALID'])).toThrow(
        'Tag must contain only lowercase letters, numbers, and hyphens'
      );
    });

    it('should throw error if photo not found', () => {
      expect(() => service.updatePhotoTags('nonexistent', ['tag'])).toThrow(
        'Photo with ID nonexistent not found'
      );
    });
  });

  describe('tagStats', () => {
    it('should compute tag statistics', () => {
      const photo1: Photo = {
        id: '1',
        filename: 'test1.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['vacation', 'beach'],
        size: 1000,
      };

      const photo2: Photo = {
        id: '2',
        filename: 'test2.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['vacation', 'mountains'],
        size: 1000,
      };

      service.addPhoto(photo1);
      service.addPhoto(photo2);

      const stats = service.tagStats();
      expect(stats).toHaveLength(3);
      expect(stats[0]).toEqual({ name: 'vacation', count: 2 });
    });

    it('should return empty array when no photos', () => {
      expect(service.tagStats()).toEqual([]);
    });
  });

  describe('filterByTags', () => {
    beforeEach(() => {
      const photo1: Photo = {
        id: '1',
        filename: 'test1.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['vacation', 'beach'],
        size: 1000,
      };

      const photo2: Photo = {
        id: '2',
        filename: 'test2.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['vacation', 'mountains'],
        size: 1000,
      };

      service.addPhoto(photo1);
      service.addPhoto(photo2);
    });

    it('should return all photos when no tags specified', () => {
      const filtered = service.filterByTags([]);
      expect(filtered()).toHaveLength(2);
    });

    it('should filter by single tag', () => {
      const filtered = service.filterByTags(['beach']);
      expect(filtered()).toHaveLength(1);
      expect(filtered()[0].tags).toContain('beach');
    });

    it('should filter by multiple tags (AND logic)', () => {
      const filtered = service.filterByTags(['vacation', 'beach']);
      expect(filtered()).toHaveLength(1);
      expect(filtered()[0].tags).toEqual(['vacation', 'beach']);
    });
  });

  describe('clearAll', () => {
    it('should clear all photos', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);
      expect(service.photos()).toHaveLength(1);

      service.clearAll();
      expect(service.photos()).toHaveLength(0);
    });

    it('should remove from localStorage', () => {
      const photo: Photo = {
        id: '1',
        filename: 'test.jpg',
        dataUrl: 'data:image/jpeg;base64,test',
        uploadedAt: new Date(),
        tags: ['test'],
        size: 1000,
      };

      service.addPhoto(photo);
      service.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('photo-gallery:photos');
    });
  });

  describe('localStorage persistence', () => {
    it('should load photos from localStorage on init', () => {
      const photos: Photo[] = [
        {
          id: '1',
          filename: 'test.jpg',
          dataUrl: 'data:image/jpeg;base64,test',
          uploadedAt: new Date(),
          tags: ['test'],
          size: 1000,
        },
      ];

      mockLocalStorage['photo-gallery:photos'] = JSON.stringify(photos);

      // Create new service instance to trigger constructor
      const newService = new PhotoService();

      expect(newService.photos()).toHaveLength(1);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      mockLocalStorage['photo-gallery:photos'] = 'invalid json';

      // Should not throw
      const newService = new PhotoService();
      expect(newService.photos()).toEqual([]);
    });
  });
});
