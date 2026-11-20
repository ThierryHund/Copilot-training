import { Component } from '@angular/core';
import { PhotoUploadComponent } from './components/photo-upload.component';
import { PhotoListComponent } from './components/photo-list.component';

/**
 * Root application component for the Photo Gallery.
 * 
 * This application demonstrates modern Angular best practices including:
 * - Standalone components with signal-based state management
 * - Type-safe models with comprehensive validation
 * - Service-based architecture with reactive state
 * - Accessibility compliance (WCAG 2.1)
 * - LocalStorage persistence with error handling
 * 
 * @example
 * <app-root />
 */
@Component({
  imports: [PhotoUploadComponent, PhotoListComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'Photo Gallery';
}
