import { Component, signal, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { PhotoService } from '../services/photo.service';
import { validatePhotoFile, PhotoConstraints } from '../models/photo.model';

/**
 * Component for uploading photos with validation and tag management.
 * 
 * Features:
 * - File input with validation (size, type, filename)
 * - Drag and drop support
 * - Tag management (add/remove)
 * - Real-time error feedback
 * - Preview of selected file
 * 
 * @example
 * <app-photo-upload />
 */
@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="upload-container">
      <h2>Upload Photo</h2>

      <!-- Drag & Drop Zone -->
      <div
        class="drop-zone"
        [class.drag-over]="isDragOver()"
        (drop)="onDrop($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
      >
        <div class="drop-zone-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>Drag & drop your photo here</p>
          <p class="text-muted">or</p>
          <label for="file-input" class="file-label">
            Choose File
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="onFileSelected($event)"
            #fileInput
          />
          <p class="constraints">
            Max {{ maxSizeMB }}MB • JPEG, PNG, or WebP
          </p>
        </div>
      </div>

      <!-- File Preview -->
      @if (selectedFile()) {
        <div class="file-preview">
          <div class="preview-info">
            <strong>Selected:</strong> {{ selectedFile()?.name }}
            <span class="file-size">({{ formatFileSize(selectedFile()!.size) }})</span>
          </div>
          @if (previewUrl()) {
            <img [src]="previewUrl()" alt="Preview" class="preview-image" />
          }
        </div>
      }

      <!-- Error Display -->
      @if (errorMessage()) {
        <div class="error-message" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ errorMessage() }}
        </div>
      }

      <!-- Tag Input -->
      <div class="tag-section">
        <label for="tag-input">Tags</label>
        <div class="tag-input-group">
          <input
            id="tag-input"
            type="text"
            [(ngModel)]="currentTag"
            (keyup.enter)="addTag()"
            placeholder="Enter tag (lowercase, numbers, hyphens)"
            [disabled]="tags().length >= maxTags"
            class="tag-input"
          />
          <button
            type="button"
            (click)="addTag()"
            [disabled]="!currentTag || tags().length >= maxTags"
            class="btn btn-secondary"
          >
            Add Tag
          </button>
        </div>
        <p class="tag-hint">
          {{ tags().length }} / {{ maxTags }} tags
          @if (tags().length >= maxTags) {
            <span class="text-danger"> • Maximum reached</span>
          }
        </p>

        <!-- Tag List -->
        @if (tags().length > 0) {
          <div class="tag-list">
            @for (tag of tags(); track tag) {
              <span class="tag">
                {{ tag }}
                <button
                  type="button"
                  (click)="removeTag(tag)"
                  class="tag-remove"
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </span>
            }
          </div>
        }
      </div>

      <!-- Upload Button -->
      <button
        type="button"
        (click)="upload()"
        [disabled]="!canUpload()"
        class="btn btn-primary btn-upload"
      >
        @if (isUploading()) {
          Uploading...
        } @else {
          Upload Photo
        }
      </button>

      <!-- Success Message -->
      @if (successMessage()) {
        <div class="success-message" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ successMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }

    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 3rem 2rem;
      text-align: center;
      transition: all 0.3s ease;
      background-color: #fafafa;
      margin-bottom: 1.5rem;
    }

    .drop-zone.drag-over {
      border-color: #007bff;
      background-color: #e7f3ff;
    }

    .drop-zone-content svg {
      color: #666;
      margin-bottom: 1rem;
    }

    .drop-zone-content p {
      margin: 0.5rem 0;
      color: #666;
    }

    .text-muted {
      font-size: 0.875rem;
      color: #999;
    }

    .file-label {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background-color: #007bff;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .file-label:hover {
      background-color: #0056b3;
    }

    input[type="file"] {
      display: none;
    }

    .constraints {
      font-size: 0.75rem;
      color: #999;
      margin-top: 1rem;
    }

    .file-preview {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .preview-info {
      margin-bottom: 1rem;
    }

    .file-size {
      color: #666;
      font-size: 0.875rem;
    }

    .preview-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #d4edda;
      color: #155724;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .tag-section {
      margin-bottom: 1.5rem;
    }

    .tag-section label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .tag-input-group {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .tag-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
    }

    .tag-input:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }

    .tag-hint {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .text-danger {
      color: #dc3545;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background-color: #007bff;
      color: white;
      border-radius: 16px;
      font-size: 0.875rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      margin-left: 0.25rem;
    }

    .tag-remove:hover {
      opacity: 0.8;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-upload {
      width: 100%;
      padding: 0.75rem;
      font-weight: 600;
    }
  `],
})
export class PhotoUploadComponent {
  private readonly photoService = inject(PhotoService);

  // File state
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isDragOver = signal(false);

  // Tag state
  tags = signal<string[]>([]);
  currentTag = '';

  // UI state
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isUploading = signal(false);

  // Constraints
  readonly maxSizeMB = PhotoConstraints.MAX_FILE_SIZE / (1024 * 1024);
  readonly maxTags = PhotoConstraints.MAX_TAGS;

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Process selected file
   */
  private handleFile(file: File): void {
    this.clearMessages();

    // Validate file
    const validationResult = validatePhotoFile(file);
    if (!validationResult.valid) {
      this.errorMessage.set(validationResult.error || 'Invalid file');
      return;
    }

    // Set file and create preview
    this.selectedFile.set(file);
    this.createPreview(file);
  }

  /**
   * Create image preview
   */
  private createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Add tag to collection
   */
  addTag(): void {
    const tag = this.currentTag.trim();
    if (!tag) return;

    this.clearMessages();

    // Check tag count limit
    if (this.tags().length >= PhotoConstraints.MAX_TAGS) {
      this.errorMessage.set(`Cannot exceed ${PhotoConstraints.MAX_TAGS} tags`);
      return;
    }

    // Check for duplicates
    if (this.tags().includes(tag)) {
      this.errorMessage.set('Tag already exists');
      return;
    }

    // Validate tag format
    if (tag.length < 2) {
      this.errorMessage.set('Tag must be at least 2 characters');
      return;
    }

    if (!PhotoConstraints.TAG_PATTERN.test(tag)) {
      this.errorMessage.set('Tag must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    // Add tag
    this.tags.update((tags) => [...tags, tag]);
    this.currentTag = '';
  }

  /**
   * Remove tag from collection
   */
  removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
    this.clearMessages();
  }

  /**
   * Check if upload is possible
   */
  canUpload(): boolean {
    return this.selectedFile() !== null && !this.isUploading();
  }

  /**
   * Upload photo to server
   */
  async upload(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.clearMessages();
    this.isUploading.set(true);

    try {
      // Service handles API call - pass File and tags directly
      await this.photoService.uploadPhoto(file, this.tags());

      // Show success and reset
      this.successMessage.set(`Successfully uploaded ${file.name}`);
      this.resetForm();

      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      this.isUploading.set(false);
    }
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.tags.set([]);
    this.currentTag = '';
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
