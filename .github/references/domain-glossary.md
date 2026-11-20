# Photo Gallery Domain Glossary

## Purpose

This glossary defines canonical business terminology and domain model concepts for the Photo Gallery application. Use these terms consistently across code, documentation, and team communication.

---

## Core Entities

### Photo

A user-uploaded image file with associated metadata. This is the primary entity in the system.

**Backend Entity Properties** (path depends on backend — see **Code Locations** below):
- **id** (number): Auto-generated primary key
- **filename** (string): Original filename from upload
- **storedFilename** (string): Unique filename on disk (timestamp + random suffix)
- **url** (string): URL path to access the file (e.g., `/uploads/filename.jpg`)
- **size** (number): File size in bytes
- **tags** (string[]): Array of user-assigned tags (stored as JSON)
- **createdAt** (Date): Upload timestamp (auto-generated)

**Frontend Model Properties** (`apps/frontend/src/app/models/photo.model.ts`):
- **id** (string): Unique identifier (UUID or stringified backend ID)
- **filename** (string): Original filename from upload
- **dataUrl** (string): Base64-encoded image data or URL path
- **uploadedAt** (Date): Upload timestamp
- **tags** (string[]): Array of user-assigned tags
- **size** (number): File size in bytes

**Business Rules**:
- Max file size: **5MB**
- Supported formats: JPEG, PNG, GIF, WebP
- Max filename length: 255 characters
- Tags are optional but recommended for organization

**Validation Constraints**:
```typescript
const PhotoConstraints = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,        // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILENAME_LENGTH: 255,
  MAX_TAGS: 20,
  MAX_TAG_LENGTH: 30,
  TAG_PATTERN: /^[a-z0-9-]+$/,           // lowercase alphanumeric with hyphens
};
```

---

### Tag

A label used to categorize and filter photos. Tags enable organization without a hierarchical folder structure.

**Properties**:
- **name** (string): The tag text (e.g., "vacation", "family", "2024")
- **count** (number): Number of photos with this tag (computed)

**Business Rules**:
- Min length: 2 characters
- Max length: 30 characters
- Format: lowercase alphanumeric with hyphens only
- No duplicates within a single photo
- Max 20 tags per photo

**Examples**:
```
✅ Valid tags: "vacation", "summer-2024", "family-photo", "landscape"
❌ Invalid tags: "A" (too short), "My Tag" (uppercase, spaces), "tag@123" (special chars)
```

---

## Business Processes

### Photo Upload Process

**Steps**:
1. **Client Validation**: Frontend validates file size (<5MB) and type (image/*)
2. **File Selection**: User selects file via drag-drop or file picker
3. **Tag Assignment**: User optionally adds tags before upload
4. **HTTP Upload**: FormData POST to `/api/photos/upload`
5. **Server Validation**: Backend re-validates file and tags
6. **File Storage**: Multer saves file to `./dist/uploads/` with unique filename
7. **Database Insert**: PhotoEntity saved to SQLite with metadata
8. **Response**: Photo object returned to frontend
9. **State Update**: Frontend signal updated with new photo

**Error Handling**:
- Invalid file type → 400 Bad Request with message
- File too large (>5MB) → 400 Bad Request with size limit error
- Invalid tags → 400 Bad Request with validation details
- Storage failure → 500 Internal Server Error

---

### Photo Retrieval Process

**Steps**:
1. **Initial Load**: Frontend calls `GET /api/photos` on app load
2. **Database Query**: Backend queries SQLite, ordered by createdAt DESC
3. **Response Mapping**: Backend returns Photo[] array
4. **Frontend Transform**: API response mapped to frontend Photo model
5. **Signal Update**: Photos stored in signal for reactive updates

---

### Photo Deletion Process

**Steps**:
1. **User Action**: User clicks delete on a photo
2. **HTTP Request**: DELETE `/api/photos/:id`
3. **Database Delete**: PhotoEntity removed from SQLite
4. **File Cleanup**: (Optional) File removed from disk
5. **State Update**: Frontend signal updated to remove photo

---

### Tag Filtering Process

**Steps**:
1. **User Selection**: User clicks on tag(s) in tag cloud
2. **Signal Update**: Selected tags stored in signal
3. **Computed Filter**: Filtered photos computed reactively
4. **UI Update**: Photo grid re-renders with filtered results

**Filter Logic**: AND operation - photo must have ALL selected tags

---

## Data Storage

### SQLite Database

**Location**: `./dist/db/photogallery.db`

**Schema**:
```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  stored_filename TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  tags TEXT,  -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### File Storage

**Location**: `./dist/uploads/`

**Naming Convention**: `{timestamp}-{random}-{originalFilename}`
Example: `1705484523456-x7g2h-vacation.jpg`

---

## API Endpoints

### Photo API (`/api/photos`)

| Method | Endpoint | Description | Body/Params |
|--------|----------|-------------|-------------|
| GET | `/api/photos` | List all photos | - |
| GET | `/api/photos/:id` | Get single photo | id: number |
| POST | `/api/photos/upload` | Upload new photo | FormData: file, tags (optional) |
| POST | `/api/photos/:id/thumbnail` | Generate thumbnail | id: number, width, height |
| DELETE | `/api/photos/:id` | Delete photo | id: number |

---

## Terminology Conventions

### Consistent Usage

| ✅ USE | ❌ AVOID | Context |
|--------|---------|---------|
| Photo | Image, Picture, Pic | Domain model |
| Upload | Post, Add, Submit | Upload process |
| Tag | Label, Category, Keyword | Categorization |
| Delete | Remove, Trash | Deletion action |
| Filter | Search, Find | Tag-based filtering |

### Plural Forms

- **Photo** → **Photos**
- **Tag** → **Tags**

### API Response Format

Use **camelCase** for JSON fields:
```json
{
  "id": 1,
  "filename": "vacation.jpg",
  "storedFilename": "1705484523456-x7g2h-vacation.jpg",
  "url": "/uploads/1705484523456-x7g2h-vacation.jpg",
  "size": 2048576,
  "tags": ["vacation", "summer-2024"],
  "createdAt": "2025-01-17T10:30:00.000Z"
}
```

---

## Code Locations

### Backend (path depends on your chosen backend)

<details>
<summary><strong>NestJS</strong> — <code>apps/backend-nestjs/</code></summary>

| Component | Path |
|-----------|------|
| Photo Entity | `apps/backend-nestjs/src/domain/entities/photo.entity.ts` |
| Photo Model | `apps/backend-nestjs/src/domain/models/photo.model.ts` |
| Photo Service | `apps/backend-nestjs/src/domain/services/photo.service.ts` |
| Photos Controller | `apps/backend-nestjs/src/api/photos/photos.controller.ts` |
| Upload DTO | `apps/backend-nestjs/src/api/photos/dto/upload-photo.ts` |
| Storage Service | `apps/backend-nestjs/src/infrastructure/storage/legacy-storage.service.ts` |

</details>

<details>
<summary><strong>Spring Boot</strong> — <code>apps/backend-spring/</code></summary>

| Component | Path |
|-----------|------|
| Photo Entity | `apps/backend-spring/src/main/java/com/photogallery/backend/infrastructure/entity/PhotoEntity.java` |
| Photo Model | `apps/backend-spring/src/main/java/com/photogallery/backend/domain/model/Photo.java` |
| Photo Service | `apps/backend-spring/src/main/java/com/photogallery/backend/domain/service/PhotoService.java` |
| Photos Controller | `apps/backend-spring/src/main/java/com/photogallery/backend/api/photos/PhotosController.java` |
| Response DTOs | `apps/backend-spring/src/main/java/com/photogallery/backend/api/photos/dto/` |
| Exception handler | `apps/backend-spring/src/main/java/com/photogallery/backend/api/photos/GlobalExceptionHandler.java` |

</details>

<details>
<summary><strong>FastAPI</strong> — <code>apps/backend-fastapi/</code></summary>

| Component | Path |
|-----------|------|
| Photo Entity | `apps/backend-fastapi/app/infrastructure/entities.py` |
| Photo Response Model | `apps/backend-fastapi/app/domain/models.py` |
| Photo Service | `apps/backend-fastapi/app/domain/services.py` |
| Photos Router | `apps/backend-fastapi/app/api/photos.py` |
| Error Handlers | `apps/backend-fastapi/app/api/errors.py` |
| Storage Service | `apps/backend-fastapi/app/infrastructure/storage.py` |
| App Factory | `apps/backend-fastapi/app/main.py` |

</details>

<details>
<summary><strong>.NET</strong> — <code>apps/backend-dotnet/</code></summary>

| Component | Path |
|-----------|------|
| Photo Entity | `apps/backend-dotnet/Infrastructure/Entities/PhotoEntity.cs` |
| Photo Domain Model | `apps/backend-dotnet/Domain/Models/Photo.cs` |
| Photo Service | `apps/backend-dotnet/Domain/Services/PhotoService.cs` |
| Photos Controller | `apps/backend-dotnet/Api/Photos/PhotosController.cs` |
| Response DTOs | `apps/backend-dotnet/Api/Photos/Dto/` |
| Exception handler | `apps/backend-dotnet/Api/Photos/GlobalExceptionHandler.cs` |
| Repository | `apps/backend-dotnet/Infrastructure/Repositories/EfPhotoRepository.cs` |
| DbContext | `apps/backend-dotnet/Infrastructure/Data/AppDbContext.cs` |
| Storage service | `apps/backend-dotnet/Infrastructure/Storage/DiskStorage.cs` |
| Entrypoint | `apps/backend-dotnet/Program.cs` |

</details>

<details>
<summary><strong>Gin</strong> — <code>apps/backend-gin/</code></summary>

| Component | Path |
|-----------|------|
| Photo Entity | `apps/backend-gin/internal/infrastructure/entity.go` |
| Photo Domain Model | `apps/backend-gin/internal/domain/photo.go` |
| Photo Service | `apps/backend-gin/internal/domain/service.go` |
| Photos Handler | `apps/backend-gin/internal/api/photos/handler.go` |
| DTOs | `apps/backend-gin/internal/api/photos/dto.go` |
| Storage Service | `apps/backend-gin/internal/infrastructure/storage.go` |
| Entrypoint | `apps/backend-gin/cmd/server/main.go` |

</details>

### Frontend

| Component | Path |
|-----------|------|
| Photo Model | `apps/frontend/src/app/models/photo.model.ts` |
| API Photo Model | `apps/frontend/src/app/models/api-photo.model.ts` |
| Tag Model | `apps/frontend/src/app/models/tag.model.ts` |
| Photo Service | `apps/frontend/src/app/services/photo.service.ts` |
| Photo API Service | `apps/frontend/src/app/services/photo-api.service.ts` |
| Photo Upload Component | `apps/frontend/src/app/components/photo-upload.component.ts` |
| Photo List Component | `apps/frontend/src/app/components/photo-list.component.ts` |

---

## References

- **Architecture**: [architecture.md](architecture.md)
- **Coding Standards**: [coding-standards.md](coding-standards.md)
- **Testing Guidelines**: [testing-guidelines.md](testing-guidelines.md)
