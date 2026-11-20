import { Component, computed, signal, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { PhotoService } from '../services/photo.service';
import { Photo } from '../models/photo.model';

/**
 * Component for displaying a grid of photos with filtering and management.
 * 
 * Features:
 * - Responsive grid layout
 * - Tag-based filtering
 * - Tag statistics sidebar
 * - Photo deletion
 * - Empty state handling
 * 
 * @example
 * <app-photo-list />
 */
@Component({
  selector: 'app-photo-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="photo-list-container">
      <div class="header">
        <h2>Photo Gallery</h2>
        <div class="photo-count">
          {{ filteredPhotos().length }} photo{{ filteredPhotos().length !== 1 ? 's' : '' }}
          @if (selectedTags().length > 0) {
            <span class="filter-indicator">
              (filtered by: {{ selectedTags().join(', ') }})
            </span>
          }
        </div>
      </div>

      <div class="content-layout">
        <!-- Tag Filter Sidebar -->
        <aside class="sidebar">
          <h3>Filter by Tags</h3>
          
          @if (tagStats().length > 0) {
            <div class="tag-filters">
              @for (stat of tagStats(); track stat.name) {
                <label class="tag-filter">
                  <input
                    type="checkbox"
                    [checked]="selectedTags().includes(stat.name)"
                    (change)="toggleTag(stat.name)"
                  />
                  <span class="tag-name">{{ stat.name }}</span>
                  <span class="tag-count">{{ stat.count }}</span>
                </label>
              }
            </div>
            
            @if (selectedTags().length > 0) {
              <button
                type="button"
                (click)="clearFilters()"
                class="btn btn-secondary btn-clear"
              >
                Clear Filters
              </button>
            }
          } @else {
            <p class="no-tags">No tags available</p>
          }
        </aside>

        <!-- Photo Grid -->
        <main class="main-content">
          @if (filteredPhotos().length > 0) {
            <div class="photo-grid">
              @for (photo of filteredPhotos(); track photo.id) {
                <div class="photo-card">
                  <div class="photo-image-container">
                    <img
                      [src]="photo.dataUrl"
                      [alt]="photo.filename"
                      class="photo-image"
                      tabindex="0"
                      role="button"
                      (click)="selectPhoto(photo)"
                      (keyup.enter)="selectPhoto(photo)"
                    />
                    <button
                      type="button"
                      (click)="deletePhoto(photo.id)"
                      [disabled]="deletingId() === photo.id"
                      class="btn-delete"
                      aria-label="Delete photo"
                      title="Delete photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div class="photo-info">
                    <div class="photo-filename" [title]="photo.filename">
                      {{ photo.filename }}
                    </div>
                    <div class="photo-meta">
                      <span class="photo-date">
                        {{ formatDate(photo.uploadedAt) }}
                      </span>
                      <span class="photo-size">
                        {{ formatFileSize(photo.size) }}
                      </span>
                    </div>
                    
                    @if (photo.tags.length > 0) {
                      <div class="photo-tags">
                        @for (tag of photo.tags; track tag) {
                          <span 
                            class="tag"
                            [class.selected]="selectedTags().includes(tag)"
                            tabindex="0"
                            role="button"
                            (click)="toggleTag(tag)"
                            (keyup.enter)="toggleTag(tag)"
                          >
                            {{ tag }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              @if (selectedTags().length > 0) {
                <h3>No photos match the selected filters</h3>
                <p>Try adjusting your tag filters or clear them to see all photos.</p>
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="btn btn-primary"
                >
                  Clear Filters
                </button>
              } @else {
                <h3>No photos yet</h3>
                <p>Upload your first photo to get started!</p>
              }
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .photo-list-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header h2 {
      margin: 0;
    }

    .photo-count {
      font-size: 1rem;
      color: #666;
    }

    .filter-indicator {
      font-size: 0.875rem;
      color: #007bff;
    }

    .content-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .content-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Sidebar Styles */
    .sidebar {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 2rem;
    }

    .sidebar h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
    }

    .tag-filters {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .tag-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .tag-filter:hover {
      background-color: rgba(0, 123, 255, 0.1);
    }

    .tag-filter input[type="checkbox"] {
      cursor: pointer;
    }

    .tag-name {
      flex: 1;
      font-size: 0.9375rem;
    }

    .tag-count {
      background-color: #007bff;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .no-tags {
      color: #666;
      font-size: 0.875rem;
      font-style: italic;
      margin: 0;
    }

    .btn-clear {
      width: 100%;
      margin-top: 1rem;
    }

    /* Photo Grid Styles */
    .main-content {
      min-height: 400px;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .photo-card {
      background-color: white;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .photo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .photo-image-container {
      position: relative;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background-color: #f8f9fa;
    }

    .photo-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }

    .btn-delete {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: rgba(220, 53, 69, 0.9);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-card:hover .btn-delete {
      opacity: 1;
    }

    .btn-delete:hover {
      background-color: rgba(200, 35, 51, 0.95);
    }

    .photo-info {
      padding: 1rem;
    }

    .photo-filename {
      font-weight: 600;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .photo-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 0.75rem;
    }

    .photo-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .tag {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      background-color: #e9ecef;
      color: #495057;
      border-radius: 12px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }

    .tag:hover {
      background-color: #007bff;
      color: white;
    }

    .tag.selected {
      background-color: #007bff;
      color: white;
    }

    /* Empty State Styles */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      color: #666;
    }

    .empty-state svg {
      color: #ccc;
      margin-bottom: 1.5rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      max-width: 400px;
    }

    /* Button Styles */
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }
  `],
})
export class PhotoListComponent {
  private readonly photoService = inject(PhotoService);

  // State
  selectedTags = signal<string[]>([]);
  selectedPhoto = signal<Photo | null>(null);
  deletingId = signal<string | null>(null);

  // Computed properties
  tagStats = computed(() => this.photoService.tagStats());
  filteredPhotos = computed(() => {
    const tags = this.selectedTags();
    if (tags.length === 0) {
      return this.photoService.photos();
    }
    return this.photoService.filterByTags(tags)();
  });

  /**
   * Toggle tag filter selection
   */
  toggleTag(tag: string): void {
    this.selectedTags.update((tags) => {
      if (tags.includes(tag)) {
        return tags.filter((t) => t !== tag);
      } else {
        return [...tags, tag];
      }
    });
  }

  /**
   * Clear all tag filters
   */
  clearFilters(): void {
    this.selectedTags.set([]);
  }

  /**
   * Select a photo for detailed view
   */
  selectPhoto(photo: Photo): void {
    this.selectedPhoto.set(photo);
    // TODO: Emit event or navigate to detail view
    console.log('Selected photo:', photo);
  }

  /**
   * Delete a photo from the server
   */
  async deletePhoto(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    this.deletingId.set(id);
    try {
      await this.photoService.removePhoto(id);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      this.deletingId.set(null);
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
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
