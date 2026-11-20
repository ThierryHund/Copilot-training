import { Injectable } from '@nestjs/common';

/**
 * Legacy callback type for storage operations
 */
type StorageCallback<T> = (error: Error | null, result?: T) => void;

/**
 * Legacy Storage Service
 *
 * This service uses callback-based patterns that are common in legacy codebases.
 * It's intentionally written with older patterns to serve as an exercise target
 * for refactoring to modern async/await patterns.
 *
 * Exercise: Refactor these callback-based methods to use Promises/async-await
 */
@Injectable()
export class LegacyStorageService {
  private storage: Map<string, Buffer> = new Map();

  /**
   * Store a file using callback pattern
   * @param key - The storage key
   * @param data - The file data as Buffer
   * @param callback - Callback function (error-first pattern)
   */
  storeFile(key: string, data: Buffer, callback: StorageCallback<string>): void {
    // Simulate async storage operation
    setTimeout(() => {
      try {
        this.storage.set(key, data);
        callback(null, key);
      } catch (error) {
        callback(error as Error);
      }
    }, 100);
  }

  /**
   * Retrieve a file using callback pattern
   * @param key - The storage key
   * @param callback - Callback function (error-first pattern)
   */
  retrieveFile(key: string, callback: StorageCallback<Buffer>): void {
    // Simulate async retrieval operation
    setTimeout(() => {
      try {
        const data = this.storage.get(key);
        if (!data) {
          callback(new Error(`File not found: ${key}`));
          return;
        }
        callback(null, data);
      } catch (error) {
        callback(error as Error);
      }
    }, 50);
  }

  /**
   * Delete a file using callback pattern
   * @param key - The storage key
   * @param callback - Callback function (error-first pattern)
   */
  deleteFile(key: string, callback: StorageCallback<boolean>): void {
    // Simulate async delete operation
    setTimeout(() => {
      try {
        const existed = this.storage.delete(key);
        callback(null, existed);
      } catch (error) {
        callback(error as Error);
      }
    }, 50);
  }

  /**
   * Check if a file exists using callback pattern
   * @param key - The storage key
   * @param callback - Callback function (error-first pattern)
   */
  fileExists(key: string, callback: StorageCallback<boolean>): void {
    // Simulate async check operation
    setTimeout(() => {
      try {
        const exists = this.storage.has(key);
        callback(null, exists);
      } catch (error) {
        callback(error as Error);
      }
    }, 25);
  }

  /**
   * List all stored files using callback pattern
   * @param callback - Callback function (error-first pattern)
   */
  listFiles(callback: StorageCallback<string[]>): void {
    // Simulate async list operation
    setTimeout(() => {
      try {
        const keys = Array.from(this.storage.keys());
        callback(null, keys);
      } catch (error) {
        callback(error as Error);
      }
    }, 50);
  }
}
