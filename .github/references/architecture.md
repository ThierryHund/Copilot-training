# Photo Gallery Architecture Reference

## System Overview

The Photo Gallery application is a full-stack web application built on a layered architecture with clear separation of concerns. The system handles photo uploads, storage, metadata management, and tag-based organization.

### Technology Stack

- **Frontend**: Angular 20+ (TypeScript, signals-based state management)
- **Backend API** (trainee-choosable; implementations are interchangeable behind the same OpenAPI contract — see [`docs/openapi.yaml`](../../../docs/openapi.yaml)):
  - **NestJS 11** (TypeScript, TypeORM) — reference implementation at `apps/backend-nestjs/`
  - **Spring Boot 4** (Java 17, Spring Data JPA + Hibernate) at `apps/backend-spring/`
  - **FastAPI** (Python 3.12, SQLModel) at `apps/backend-fastapi/`
  - **ASP.NET Core 8** (C# 12, EF Core) at `apps/backend-dotnet/`
  - **Gin** (Go 1.23, GORM) at `apps/backend-gin/`
- **Database**: SQLite (all four backends)
- **File Storage**: Local disk (`./uploads/` — served at `/uploads/*` by whichever backend is running)
- **Build Tool**: Nx monorepo (TypeScript projects only); Maven / uv / go modules for the alt backends
- **Testing**: Vitest + Playwright for frontend & NestJS; JUnit/pytest/go test for the alt backends

---

## Architecture Layers

### 1. Presentation Layer (`apps/frontend/src/app/`)

**Responsibility**: User interface components, views, and user interaction handling

**Technologies**: Angular standalone components, Angular signals, HttpClient

**Key Modules**:
- `components/`: Reusable UI components (PhotoUploadComponent, PhotoListComponent)
- `services/`: State management and API communication
- `models/`: TypeScript interfaces and validation

**Conventions**:
- Components are standalone (no NgModules)
- State managed with Angular signals (`signal()`, `computed()`)
- Dependency injection via `inject()` function
- All HTTP calls go through service layer

```typescript
// Example: Standalone Component with Signals
@Component({
  selector: 'app-photo-list',
  standalone: true,
  imports: [CommonModule]
})
export class PhotoListComponent {
  private readonly photoService = inject(PhotoService);

  // Reactive state with signals
  readonly photos = this.photoService.photos;
  readonly selectedTags = signal<string[]>([]);

  // Computed values automatically update
  readonly filteredPhotos = computed(() => {
    const tags = this.selectedTags();
    if (tags.length === 0) return this.photos();
    return this.photos().filter(photo =>
      tags.every(tag => photo.tags.includes(tag))
    );
  });
}
```

---

### 2. Application/Service Layer (`apps/frontend/src/app/services/`)

**Responsibility**: Business logic, state management, API communication

**Technologies**: Angular services with signals, HttpClient

**Key Services**:
- `PhotoService`: Orchestrates photo operations and maintains state
- `PhotoApiService`: HTTP client for backend communication

**Conventions**:
- Services are singleton (`providedIn: 'root'`)
- Use signals for reactive state management
- Error handling centralized in services

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly apiService = inject(PhotoApiService);

  // Signal-based state
  private readonly photosSignal = signal<Photo[]>([]);
  readonly photos = this.photosSignal.asReadonly();

  // Computed statistics
  readonly tagStats = computed(() => {
    const photos = this.photosSignal();
    const tagCounts = new Map<string, number>();
    photos.forEach(photo => {
      photo.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }));
  });

  async uploadPhoto(file: File, tags: string[]): Promise<void> {
    const photo = await firstValueFrom(
      this.apiService.uploadPhoto(file, tags)
    );
    this.photosSignal.update(photos => [photo, ...photos]);
  }
}
```

---

### 3. Domain Layer

**Responsibility**: Core business entities and business logic. Stack-neutral in spirit: defines what a `Photo` is and what operations exist, without coupling to HTTP or database mechanics.

**Key concepts** (same in all four backends):
- A `Photo` entity persisted in SQLite with fields: `id`, `filename`, `storedFilename` (unique), `url`, `size`, `tags` (JSON-encoded list), `createdAt`
- A `PhotoService` owning upload/list/get/thumbnail/delete operations
- A repository abstraction the service calls — concrete implementation lives in infrastructure

<details>
<summary><strong>NestJS (TypeScript)</strong> — <code>apps/backend-nestjs/src/domain/</code></summary>

```typescript
// apps/backend-nestjs/src/domain/entities/photo.entity.ts
@Entity('photos')
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column({ name: 'stored_filename', unique: true })
  storedFilename: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column('simple-json')
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

The `Photo` class in `domain/models/photo.model.ts` is decorated with `@ApiProperty` so it doubles as the Swagger response schema.

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong> — <code>apps/backend-spring/src/main/java/.../domain/</code></summary>

```java
// apps/backend-spring/src/main/java/com/photogallery/backend/infrastructure/entity/PhotoEntity.java
@Entity
@Table(name = "photos")
public class PhotoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "stored_filename", unique = true, nullable = false)
    private String storedFilename;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private Long size;

    @Convert(converter = StringListJsonConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
```

`StringListJsonConverter` is an `AttributeConverter<List<String>, String>` that serializes via Jackson — matching NestJS's `simple-json` behavior.

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong> — <code>apps/backend-fastapi/app/domain/</code></summary>

```python
# apps/backend-fastapi/app/infrastructure/entities.py
class PhotoEntity(SQLModel, table=True):
    __tablename__ = "photos"

    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    stored_filename: str = Field(unique=True, index=True)
    url: str
    size: int
    # tags stored as JSON TEXT to mirror TypeORM 'simple-json'
    tags_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def tags_list(self) -> list[str]:
        return json.loads(self.tags_json)
```

The `PhotoResponse` Pydantic model (`app/domain/models.py`) serializes to camelCase via `alias_generator=to_camel` — the response shape matches NestJS exactly.

</details>

<details>
<summary><strong>.NET (C#)</strong> — <code>apps/backend-dotnet/Domain/</code> + <code>apps/backend-dotnet/Infrastructure/Entities/</code></summary>

```csharp
// apps/backend-dotnet/Infrastructure/Entities/PhotoEntity.cs
[Table("photos")]
public class PhotoEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Filename { get; set; } = string.Empty;

    [Required, Column("stored_filename")]
    public string StoredFilename { get; set; } = string.Empty;

    [Required]
    public string Url { get; set; } = string.Empty;

    public long Size { get; set; }

    // tags stored as JSON TEXT via StringListJsonConverter — mirrors simple-json
    public List<string> Tags { get; set; } = new();

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

`Domain/Models/Photo.cs` is a record separate from the EF entity; the mapping happens in `PhotoService`. `PhotoResponse` (the DTO returned to the wire) serializes to camelCase automatically via ASP.NET Core's default `System.Text.Json` settings.

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong> — <code>apps/backend-gin/internal/domain/</code> + <code>internal/infrastructure/</code></summary>

```go
// apps/backend-gin/internal/infrastructure/entity.go
type PhotoEntity struct {
    ID             uint           `gorm:"primaryKey"`
    Filename       string         `gorm:"not null"`
    StoredFilename string         `gorm:"uniqueIndex;not null"`
    URL            string         `gorm:"not null"`
    Size           int64          `gorm:"not null"`
    Tags           datatypes.JSON `gorm:"type:text"`   // mirrors simple-json
    CreatedAt      time.Time
}
```

The DTO in `internal/api/photos/dto.go` has JSON tags that output camelCase, matching the other backends.

</details>

---

### 4. Infrastructure Layer

**Responsibility**: Persistence and file storage. Implements the repository abstraction declared in the domain layer.

**Shared invariants across all four backends**:
- Uploads saved under `./uploads/` on the local filesystem
- Unique filename: `{epochMillis}-{random}.{ext}`
- Served statically at `/uploads/<storedFilename>`
- `tags` column stored as JSON-encoded text in SQLite

<details>
<summary><strong>NestJS (TypeScript)</strong> — <code>apps/backend-nestjs/src/infrastructure/</code></summary>

- `TypeOrmPhotoRepository` implements the `PhotoRepository` interface
- Multer `diskStorage` handles upload writes; file size + MIME filter applied via `MaxFileSizeValidator` + `FileTypeValidator`
- `LegacyStorageService` is a deliberate callback-style stub kept around for refactoring exercises in labs 103+

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong> — <code>apps/backend-spring/.../infrastructure/</code></summary>

- `PhotoRepository extends JpaRepository<PhotoEntity, Long>` — Spring Data generates the implementation
- `StaticResourceConfig` registers `ResourceHandler` for `/uploads/**` → filesystem path
- `MultipartProperties` (wired via `application.yml`) enforces `max-file-size: 5MB`
- MIME type validated in `PhotoService` against a whitelist; violations throw `IllegalArgumentException` mapped by `GlobalExceptionHandler` to a 400

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong> — <code>apps/backend-fastapi/app/infrastructure/</code></summary>

- `database.py` exposes `get_session()` — a SQLModel `Session` context manager
- `storage.py` writes the uploaded bytes to `./uploads/` with the unique filename scheme
- `main.py` mounts `StaticFiles(directory="uploads")` at `/uploads` **after** the `/api` router include (order matters — routers take precedence over static mounts)
- Size/MIME validation happens in the `photos.py` router before the service is called

</details>

<details>
<summary><strong>.NET (C#)</strong> — <code>apps/backend-dotnet/Infrastructure/</code></summary>

- `EfPhotoRepository` implements `IPhotoRepository` using `AppDbContext` (EF Core)
- `AppDbContext.OnModelCreating` applies `StringListJsonConverter` to `PhotoEntity.Tags` with `HasColumnType("TEXT")` — mirrors `simple-json` behavior
- `Program.cs` wires `services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 5 * 1024 * 1024)` for the 5 MB cap
- `app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(uploadsPath), RequestPath = "/uploads" })` serves `./uploads/`
- MIME check against a `HashSet<string> { "image/jpeg", "image/png", "image/gif", "image/webp" }` inside `PhotosController`; violations return 400 via the shared `ErrorEnvelope` shape produced by `GlobalExceptionHandler`

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong> — <code>apps/backend-gin/internal/infrastructure/</code></summary>

- `repository.go` wraps a `*gorm.DB`, exposing `Create`, `FindAll`, `FindByID`, `Delete` — the service depends on this interface
- `router.Static("/uploads", "./uploads")` serves static assets
- `router.MaxMultipartMemory = 10 << 20` + per-file size check in the handler enforce the 5 MB cap
- MIME check uses Go's `mime.TypeByExtension` plus a whitelist

</details>

---

### 5. API Layer

**Responsibility**: Translate HTTP requests to domain service calls and shape responses per the OpenAPI contract.

**Shared contract** (same in all four backends): base path `/api`, endpoints `POST /photos/upload`, `GET /photos`, `GET /photos/:id`, `POST /photos/:id/thumbnail`, `DELETE /photos/:id`. Full schema in [`docs/openapi.yaml`](../../../docs/openapi.yaml).

<details>
<summary><strong>NestJS (TypeScript)</strong> — <code>apps/backend-nestjs/src/api/photos/</code></summary>

```typescript
// apps/backend-nestjs/src/api/photos/photos.controller.ts
@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhotoDto })
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadPhoto(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(jpeg|png|gif|webp)/ }),
      ],
    })) file: Express.Multer.File,
    @Body('tags') tags?: string,
  ): Promise<Photo> {
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    return this.photoService.uploadPhoto(file, tagList);
  }
}
```

Swagger at `GET /api/docs` (set up in `src/main.ts`).

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong> — <code>apps/backend-spring/.../api/photos/</code></summary>

```java
// apps/backend-spring/src/main/java/com/photogallery/backend/api/photos/PhotosController.java
@RestController
@RequestMapping("/api/photos")
public class PhotosController {
    private final PhotoService photoService;

    public PhotosController(PhotoService photoService) { this.photoService = photoService; }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "tags", required = false) String tags
    ) {
        List<String> tagList = tags == null
            ? List.of()
            : Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return ResponseEntity.status(201).body(photoService.uploadPhoto(file, tagList));
    }
}
```

Swagger at `GET /api/docs` (springdoc-openapi). Errors shaped by `GlobalExceptionHandler` to match NestJS envelope.

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong> — <code>apps/backend-fastapi/app/api/</code></summary>

```python
# apps/backend-fastapi/app/api/photos.py
router = APIRouter(prefix="/photos", tags=["photos"])

@router.post("/upload", response_model=PhotoResponse, response_model_by_alias=True, status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    tags: str | None = Form(default=None),
    service: PhotoService = Depends(get_photo_service),
):
    if file.size and file.size > 5 * 1024 * 1024:
        raise FileTooLargeError()
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedMediaTypeError()
    tag_list = [t.strip() for t in (tags or "").split(",") if t.strip()]
    return await service.upload_photo(file, tag_list)
```

Swagger auto-generated at `GET /api/docs` (FastAPI's built-in, configured via `FastAPI(docs_url="/api/docs", ...)`).

</details>

<details>
<summary><strong>.NET (C#)</strong> — <code>apps/backend-dotnet/Api/Photos/</code></summary>

```csharp
// apps/backend-dotnet/Api/Photos/PhotosController.cs
[ApiController]
[Route("api/photos")]
public class PhotosController(IPhotoService photoService) : ControllerBase
{
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhotoResponse>> UploadPhoto(
        [FromForm] IFormFile file,
        [FromForm] string? tags,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new ErrorEnvelope(400, "file is required", "Bad Request"));
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new ErrorEnvelope(400, "File size exceeds 5MB limit", "Bad Request"));
        var tagList = (tags ?? "").Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToList();
        var photo = await photoService.UploadPhotoAsync(file, tagList, ct);
        return StatusCode(201, photo);
    }
}
```

Swagger at `GET /api/docs` via `Swashbuckle.AspNetCore`. `GlobalExceptionHandler` (implementing `IExceptionHandler`, new in .NET 8) produces the NestJS-shaped envelope. camelCase JSON comes from `System.Text.Json` defaults.

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong> — <code>apps/backend-gin/internal/api/photos/</code></summary>

```go
// apps/backend-gin/internal/api/photos/handler.go
func (h *Handler) UploadPhoto(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil { c.JSON(400, errors.Envelope(400, "file is required", "Bad Request")); return }
    if file.Size > 5<<20 { c.JSON(400, errors.Envelope(400, "File size exceeds 5MB limit", "Bad Request")); return }
    // ...MIME check...
    tags := parseTags(c.PostForm("tags"))
    result, err := h.service.Upload(c.Request.Context(), file, tags)
    if err != nil { c.JSON(500, errors.Envelope(500, err.Error(), "Internal Server Error")); return }
    c.JSON(201, result)
}
```

Swagger at `GET /api/docs` via `swaggo/gin-swagger` (generated from code annotations with `swag init`).

</details>

---

## Data Flow

### Upload Flow

```
User → PhotoUploadComponent → PhotoService → PhotoApiService → HTTP POST /api/photos/upload
                                                                    ↓
                                                            PhotosController
                                                                    ↓
                                                             PhotoService
                                                                    ↓
                                          +-------------------------+-------------------------+
                                          ↓                                                   ↓
                                   Multer (diskStorage)                              PhotoEntity Repository
                                          ↓                                                   ↓
                                   ./dist/uploads/                                    SQLite Database
                                          ↓                                                   ↓
                                          +-------------------------+-------------------------+
                                                                    ↓
                                                           Photo Response → User
```

### Read Flow

```
User → PhotoListComponent → PhotoService.photos (signal) → initial load from API
                                                                    ↓
                                                            PhotoApiService.getPhotos()
                                                                    ↓
                                                            PhotosController.getPhotos()
                                                                    ↓
                                                             PhotoService.getPhotos()
                                                                    ↓
                                                    PhotoEntity Repository.find()
                                                                    ↓
                                                           SQLite Database
                                                                    ↓
                                                           Photo[] → User
```

---

## Module Boundaries

### Dependency Rules

1. **UI Layer** depends on: Application Layer, Domain Layer
2. **Application Layer** depends on: Domain Layer, Infrastructure Layer (via interfaces)
3. **Domain Layer** depends on: NOTHING (pure domain logic)
4. **Infrastructure Layer** depends on: Domain Layer (implements interfaces)
5. **API Layer** depends on: Domain Layer services

### Forbidden Dependencies

- ❌ Domain Layer → Infrastructure Layer
- ❌ UI Layer → Infrastructure Layer (must go through Application Layer)
- ❌ UI Layer → API Layer (frontend and backend are separate deployments)

---

## Cross-Cutting Concerns

### Error Handling

- Global error handler in API layer
- Consistent error response format:
  ```json
  {
    "statusCode": 400,
    "message": "File size exceeds 5MB limit",
    "error": "Bad Request"
  }
  ```

### Logging

Each backend uses its framework's default logger, but all log at roughly the same level scheme (ERROR, WARN, INFO, DEBUG).

<details>
<summary><strong>NestJS</strong></summary>

NestJS's built-in `Logger` class; levels `ERROR`, `WARN`, `LOG`, `DEBUG`, `VERBOSE`.

</details>

<details>
<summary><strong>Spring Boot</strong></summary>

SLF4J + Logback (default). Configure via `application.yml` `logging.level.*` keys.

</details>

<details>
<summary><strong>FastAPI</strong></summary>

Python's stdlib `logging` module. Uvicorn configures access/error loggers on startup; application code uses `logging.getLogger(__name__)`.

</details>

<details>
<summary><strong>.NET</strong></summary>

`Microsoft.Extensions.Logging` (`ILogger<T>` injected into services via DI). Levels `Critical`, `Error`, `Warning`, `Information`, `Debug`, `Trace`. Configurable in `appsettings.json` under the `Logging:LogLevel` section.

</details>

<details>
<summary><strong>Gin</strong></summary>

Gin's built-in `gin.Logger()` middleware for HTTP access logs; stdlib `log` or `log/slog` for application logs.

</details>

### File Validation

- Max file size: **5MB**
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
- Max filename length: 255 characters
- Tags: lowercase alphanumeric with hyphens, max 20 tags, max 30 chars each

---

## Database Schema

### Photos Table (SQLite)

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| filename | TEXT | NOT NULL |
| stored_filename | TEXT | UNIQUE, NOT NULL |
| url | TEXT | NOT NULL |
| size | INTEGER | NOT NULL |
| tags | TEXT | JSON array |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## Development Environment

### Local Setup

Install Node dependencies once (required for the frontend regardless of backend choice):

```bash
npm ci
```

Then start the frontend plus **one** backend of your choice. The frontend listens on port **42620** and proxies `/api/*` + `/uploads/*` to port **42621**. All four backends bind 42621.

<details>
<summary><strong>NestJS</strong></summary>

```bash
npm run serve:backend-nestjs    # port 42621
# in another terminal:
npm run serve                   # frontend on 42620
```

</details>

<details>
<summary><strong>Spring Boot</strong></summary>

```bash
npm run serve:backend-spring    # port 42621 (env SPRING_BACKEND_PORT)
# in another terminal:
npm run serve                   # frontend on 42620
```

</details>

<details>
<summary><strong>FastAPI</strong></summary>

```bash
cd apps/backend-fastapi && uv sync   # first time only
npm run serve:backend-fastapi         # port 42621 (env FASTAPI_BACKEND_PORT)
# in another terminal:
npm run serve                         # frontend on 42620
```

</details>

<details>
<summary><strong>.NET</strong></summary>

```bash
dotnet restore apps/backend-dotnet    # first time only
npm run serve:backend-dotnet           # port 42621 (env DOTNET_BACKEND_PORT)
# in another terminal:
npm run serve                          # frontend on 42620
```

</details>

<details>
<summary><strong>Gin</strong></summary>

```bash
npm run serve:backend-gin       # port 42621 (env GIN_BACKEND_PORT)
# in another terminal:
npm run serve                   # frontend on 42620
```

</details>

### File Storage

- Upload directory: `./uploads/` (each backend writes here; the frontend reads via `/uploads/*`)
- Database file: `./data/photogallery.db` (Spring/FastAPI/Gin) or `./dist/db/photogallery.db` (NestJS — relative to dist output)
- All auto-created on first run

### API Proxy

Frontend dev server proxies `/api/*` and `/uploads/*` to `http://localhost:42621` (configured in [`apps/frontend/proxy.conf.json`](../../../apps/frontend/proxy.conf.json)). Swapping backends never requires proxy config changes — they all bind the same port.

---

## Future Roadmap

- **Phase 1**: Add real-time photo updates via WebSockets
- **Phase 2**: Implement photo albums and collections
- **Phase 3**: Add user authentication
- **Phase 4**: Migrate to cloud storage (S3) and PostgreSQL for production

---

## References

- **Domain Glossary**: [domain-glossary.md](domain-glossary.md)
- **Coding Standards**: [coding-standards.md](coding-standards.md)
- **Testing Guidelines**: [testing-guidelines.md](testing-guidelines.md)
- **On-Call Procedures**: [oncall.md](oncall.md)
