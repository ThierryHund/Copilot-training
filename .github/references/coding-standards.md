# Photo Gallery Coding Standards

## General Principles

- **Readability First**: Code is read 10x more than written
- **Consistency**: Follow established patterns
- **Simplicity**: Prefer simple solutions over clever ones
- **DRY (Don't Repeat Yourself)**: Extract reusable logic
- **YAGNI (You Aren't Gonna Need It)**: Don't over-engineer

---

## TypeScript Conventions (Angular frontend & NestJS backend)

These conventions apply to the Angular frontend (always) and to the NestJS backend (when that is the chosen backend). Trainees on Spring Boot / FastAPI / Gin should follow their language's standard style guides and the per-backend sub-blocks below.

### Naming

- **PascalCase**: Classes, interfaces, types, enums
- **camelCase**: Variables, functions, methods, properties
- **UPPER_SNAKE_CASE**: Constants
- **kebab-case**: File names, CSS classes

```typescript
// ✅ Good
export class PhotoService { }
export interface Photo { }
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
function uploadPhoto(file: File): Promise<Photo> { }

// ❌ Bad
export class photoservice { }
const maxFileSize = 5242880;
function UploadPhoto() { }
```

### File Organization

Frontend layout (always):

```
apps/frontend/src/app/
  components/
    photo-upload.component.ts
    photo-list.component.ts
  services/
    photo.service.ts
    photo-api.service.ts
  models/
    photo.model.ts
```

Backend layout (depends on chosen backend — all four mirror the same hexagonal api → domain → infrastructure split):

<details>
<summary><strong>NestJS (TypeScript)</strong> — <code>apps/backend-nestjs/</code></summary>

```
apps/backend-nestjs/src/
  api/photos/
    photos.controller.ts
    photos.module.ts
    dto/upload-photo.ts
  domain/
    entities/photo.entity.ts
    models/photo.model.ts
    services/photo.service.ts
    repositories/photo.repository.interface.ts
  infrastructure/
    repositories/typeorm-photo.repository.ts
    storage/legacy-storage.service.ts
```

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong> — <code>apps/backend-spring/</code></summary>

```
apps/backend-spring/src/main/java/com/photogallery/backend/
  BackendSpringApplication.java
  api/photos/
    PhotosController.java
    GlobalExceptionHandler.java
    dto/{PhotoResponse,ThumbnailResponse,DeleteResponse}.java
  domain/
    model/Photo.java
    service/PhotoService.java
    repository/PhotoRepository.java
  infrastructure/
    entity/PhotoEntity.java
    config/StaticResourceConfig.java
```

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong> — <code>apps/backend-fastapi/</code></summary>

```
apps/backend-fastapi/app/
  __init__.py
  main.py
  api/{__init__,photos,errors}.py
  domain/{__init__,models,services}.py
  infrastructure/{__init__,database,entities,storage}.py
```

</details>

<details>
<summary><strong>.NET (C#)</strong> — <code>apps/backend-dotnet/</code></summary>

```
apps/backend-dotnet/
  BackendDotnet.csproj
  Program.cs
  appsettings.json
  Api/Photos/
    PhotosController.cs
    GlobalExceptionHandler.cs
    Dto/{PhotoResponse,UploadPhotoDto,DeleteResponse,ErrorEnvelope}.cs
  Domain/
    Models/Photo.cs
    Services/{IPhotoService,PhotoService}.cs
    Repositories/IPhotoRepository.cs
  Infrastructure/
    Data/AppDbContext.cs
    Entities/PhotoEntity.cs
    Converters/StringListJsonConverter.cs
    Repositories/EfPhotoRepository.cs
    Storage/{IDiskStorage,DiskStorage}.cs
```

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong> — <code>apps/backend-gin/</code></summary>

```
apps/backend-gin/
  cmd/server/main.go
  internal/
    api/photos/{handler,dto,errors}.go
    domain/{photo,service}.go
    infrastructure/{entity,repository,database,storage}.go
```

</details>

### Imports

Order: External → Internal → Relative

```typescript
// External libraries
import { Component, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Internal modules (if using path aliases)
import { Photo } from '@app/models';
import { PhotoService } from '@app/services';

// Relative imports
import { PhotoCardComponent } from './photo-card.component';
```

---

## Functions

### Size & Complexity

- **Max function length**: 50 lines
- **Max parameters**: 4 (use object for more)
- **Single responsibility**: One function, one purpose

```typescript
// ✅ Good: Single responsibility
async function uploadPhoto(file: File, tags: string[]): Promise<Photo> {
  const validated = validateFile(file);
  const saved = await saveToStorage(validated);
  return saveMetadata(saved, tags);
}

// ❌ Bad: Too many responsibilities
async function uploadPhoto(file, tags, options, metadata, callback) {
  // 150 lines of validation, processing, uploading, metadata saving...
}
```

### Error Handling

Always handle errors explicitly:

```typescript
// ✅ Good
async function getPhoto(id: number): Promise<Photo> {
  try {
    return await photoRepository.findOne({ where: { id } });
  } catch (error) {
    console.error('Failed to fetch photo', { id, error });
    throw new NotFoundException(`Photo ${id} not found`);
  }
}

// ❌ Bad: Silent failure
async function getPhoto(id: number) {
  try {
    return await photoRepository.findOne({ where: { id } });
  } catch (error) {
    return null; // Loses error context
  }
}
```

---

## TypeScript Types

### Use Strong Types

```typescript
// ✅ Good: Explicit types
interface UploadOptions {
  tags: string[];
}

function uploadPhoto(file: File, options: UploadOptions): Promise<Photo> { }

// ❌ Bad: Weak types
function uploadPhoto(file: any, options?: any): any { }
```

### Avoid `any`

Use `unknown` or proper types:

```typescript
// ✅ Good
function processData(data: unknown): Photo {
  if (isPhoto(data)) {
    return data;
  }
  throw new Error('Invalid data');
}

// ❌ Bad
function processData(data: any) {
  return data; // No type safety
}
```

---

## Angular Conventions (Frontend)

### Standalone Components

Use standalone components (no NgModules):

```typescript
@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.css']
})
export class PhotoUploadComponent {
  // Component logic
}
```

### Signal-Based State Management

Use Angular signals instead of RxJS BehaviorSubject for component state:

```typescript
@Component({
  selector: 'app-photo-list',
  standalone: true,
  imports: [CommonModule]
})
export class PhotoListComponent {
  private readonly photoService = inject(PhotoService);

  // ✅ Good: Signal-based reactive state
  readonly photos = this.photoService.photos;
  readonly selectedTags = signal<string[]>([]);
  readonly isLoading = signal(false);

  // Computed values automatically update when dependencies change
  readonly filteredPhotos = computed(() => {
    const tags = this.selectedTags();
    if (tags.length === 0) return this.photos();
    return this.photos().filter(photo =>
      tags.every(tag => photo.tags.includes(tag))
    );
  });

  // ❌ Bad: RxJS-based state in components
  // private photosSubject = new BehaviorSubject<Photo[]>([]);
  // photos$ = this.photosSubject.asObservable();
}
```

### Service Pattern with Signals

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly apiService = inject(PhotoApiService);

  // Private writable signal
  private readonly photosSignal = signal<Photo[]>([]);

  // Public read-only signal
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

### Dependency Injection

Use `inject()` function instead of constructor injection:

```typescript
// ✅ Good: inject() function
@Component({ ... })
export class PhotoComponent {
  private readonly photoService = inject(PhotoService);
  private readonly router = inject(Router);
}

// ❌ Bad: Constructor injection (older pattern)
@Component({ ... })
export class PhotoComponent {
  constructor(
    private photoService: PhotoService,
    private router: Router
  ) {}
}
```

---

## Backend Conventions

The four backends share the same hexagonal layering (api → domain → infrastructure) and the same HTTP contract, but each uses its framework's idiomatic dependency injection, routing, validation, and ORM style. Pick the sub-block matching your chosen backend.

<details>
<summary><strong>NestJS (TypeScript)</strong></summary>

### Module Organization

```typescript
// photos.module.ts
@Module({
  imports: [DomainModule],
  controllers: [PhotosController],
  providers: [],
})
export class PhotosModule {}
```

### Controller Pattern

```typescript
@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  async getPhotos(): Promise<Photo[]> {
    return this.photoService.getPhotos();
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string): Promise<Photo | null> {
    return this.photoService.getPhotoById(id);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('tags') tags?: string,
  ): Promise<Photo> {
    return this.photoService.uploadPhoto(file, parseTags(tags));
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class PhotoService {
  constructor(
    @Inject(PHOTO_REPOSITORY) private readonly repo: PhotoRepository,
  ) {}

  async getPhotos(): Promise<Photo[]> {
    const entities = await this.repo.findAll({ order: { createdAt: 'DESC' } });
    return entities.map(this.entityToPhoto);
  }
}
```

### DTOs with Validation

```typescript
import { IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown;

  @ApiProperty({ required: false, example: 'vacation,beach' })
  @IsOptional()
  @IsString()
  tags?: string;
}
```

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong></summary>

### Package / component organization

Spring picks up `@RestController`, `@Service`, `@Repository`, `@Configuration`, and `@Component` beans by component scanning from the `@SpringBootApplication` class. Keep one bean per file and use constructor injection (Spring auto-wires single-constructor beans — no `@Autowired` needed).

### Controller Pattern

```java
@RestController
@RequestMapping("/api/photos")
public class PhotosController {
    private final PhotoService photoService;

    public PhotosController(PhotoService photoService) { this.photoService = photoService; }

    @GetMapping
    public List<PhotoResponse> getPhotos() { return photoService.getPhotos(); }

    @GetMapping("/{id}")
    public PhotoResponse getPhoto(@PathVariable String id) {
        return photoService.getPhotoById(id).orElse(null);   // null body, not 404, matches NestJS
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoResponse uploadPhoto(
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "tags", required = false) String tags
    ) {
        return photoService.uploadPhoto(file, parseTags(tags));
    }
}
```

### Service Pattern

```java
@Service
public class PhotoService {
    private final PhotoRepository repo;
    private final StorageService storage;

    public PhotoService(PhotoRepository repo, StorageService storage) { /*…*/ }

    public List<PhotoResponse> getPhotos() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }
}
```

### DTOs with Validation

```java
import jakarta.validation.constraints.Size;

public record UploadPhotoDto(
    @Size(max = 20) String tags   // comma-separated; parsed in controller
) {}
```

Bean-Validation errors hit `GlobalExceptionHandler` and are mapped to the NestJS-shaped `{ statusCode, message, error }` envelope.

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong></summary>

### Router / dependency organization

Routers live in `app/api/`; services are resolved via `Depends()`. The app factory in `app/main.py` assembles them:

```python
app = FastAPI(docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json")
app.include_router(photos_router, prefix="/api")
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")   # AFTER include_router
```

### Controller (router) Pattern

```python
router = APIRouter(prefix="/photos", tags=["photos"])

@router.post("/upload", response_model=PhotoResponse, response_model_by_alias=True, status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    tags: str | None = Form(default=None),
    service: PhotoService = Depends(get_photo_service),
) -> PhotoResponse:
    _validate_upload(file)
    return await service.upload_photo(file, parse_tags(tags))

@router.get("/{id}", response_model=PhotoResponse | None, response_model_by_alias=True)
async def get_photo(id: str, service: PhotoService = Depends(get_photo_service)):
    return await service.get_photo_by_id(id)   # returns None → JSON null body, not 404
```

### Service Pattern

```python
class PhotoService:
    def __init__(self, session_factory: Callable[[], Session], storage: StorageService):
        self._session_factory = session_factory
        self._storage = storage

    async def get_photos(self) -> list[PhotoResponse]:
        with self._session_factory() as s:
            entities = s.exec(select(PhotoEntity).order_by(PhotoEntity.created_at.desc())).all()
            return [PhotoResponse.from_entity(e) for e in entities]
```

### DTOs with Validation — Pydantic v2

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class PhotoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    filename: str
    stored_filename: str   # serializes as "storedFilename"
    url: str
    size: int
    tags: list[str]
    created_at: datetime   # serializes as "createdAt"
```

Pydantic validation errors are caught by a `RequestValidationError` handler in `app/api/errors.py` and reshaped to `{ statusCode, message, error }`.

</details>

<details>
<summary><strong>.NET (C#)</strong></summary>

### Component organization

DI via primary-constructor syntax (.NET 8). `Program.cs` registers services:

```csharp
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite($"Data Source={dbPath}"));
builder.Services.AddScoped<IPhotoRepository, EfPhotoRepository>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddSingleton<IDiskStorage>(new DiskStorage(uploadsDir));
```

### Controller Pattern

```csharp
[ApiController]
[Route("api/photos")]
public class PhotosController(IPhotoService photoService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PhotoResponse>>> GetPhotos(CancellationToken ct)
        => Ok(await photoService.GetPhotosAsync(ct));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPhoto(string id, CancellationToken ct)
    {
        var photo = await photoService.GetPhotoByIdAsync(id, ct);
        return new JsonResult(photo);   // null body when missing, not 404
    }
}
```

### Service Pattern

```csharp
public class PhotoService(IPhotoRepository repo, IDiskStorage storage) : IPhotoService
{
    public async Task<List<PhotoResponse>> GetPhotosAsync(CancellationToken ct)
    {
        var entities = await repo.FindAllDescAsync(ct);
        return entities.Select(e => e.ToResponse()).ToList();
    }
}
```

### DTOs (camelCase via `System.Text.Json` defaults — no extra attributes needed)

```csharp
public record PhotoResponse(
    string Id,
    string Filename,
    string StoredFilename,
    string Url,
    long Size,
    List<string> Tags,
    DateTime CreatedAt);
```

PascalCase properties serialize to `storedFilename` / `createdAt` automatically.

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong></summary>

### Package / handler organization

One Gin `*gin.Engine` per process. `cmd/server/main.go` wires the DB, repository, service, and handler:

```go
func main() {
    db := infrastructure.OpenDB()
    repo := infrastructure.NewPhotoRepository(db)
    svc := domain.NewPhotoService(repo, infrastructure.NewDiskStorage("./uploads"))
    handler := photos.NewHandler(svc)

    r := gin.Default()
    r.MaxMultipartMemory = 10 << 20
    r.Static("/uploads", "./uploads")
    api := r.Group("/api")
    photos.RegisterRoutes(api, handler)

    // graceful shutdown …
}
```

### Handler Pattern

```go
func (h *Handler) GetPhotos(c *gin.Context) {
    photos, err := h.svc.ListPhotos(c.Request.Context())
    if err != nil { c.JSON(500, errors.Envelope(500, err.Error(), "Internal Server Error")); return }
    c.JSON(200, photos)
}

func (h *Handler) UploadPhoto(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil { c.JSON(400, errors.Envelope(400, "file is required", "Bad Request")); return }
    if file.Size > 5<<20 { c.JSON(400, errors.Envelope(400, "File size exceeds 5MB limit", "Bad Request")); return }
    tags := parseTags(c.PostForm("tags"))
    result, err := h.svc.Upload(c.Request.Context(), file, tags)
    if err != nil { c.JSON(500, errors.Envelope(500, err.Error(), "Internal Server Error")); return }
    c.JSON(201, result)
}
```

### Service / Repository Pattern

```go
// internal/domain/service.go
type PhotoService struct {
    repo    PhotoRepository
    storage Storage
}

func (s *PhotoService) ListPhotos(ctx context.Context) ([]dto.PhotoResponse, error) {
    entities, err := s.repo.FindAllDesc(ctx)
    if err != nil { return nil, err }
    return dto.FromEntities(entities), nil
}
```

### DTOs with Validation

Gin binds struct tags via `binding:"…"`. For multipart uploads, validate the `*multipart.FileHeader` manually (size + MIME type whitelist) since `binding:` doesn't cover those.

```go
type PhotoResponse struct {
    ID             string    `json:"id"`
    Filename       string    `json:"filename"`
    StoredFilename string    `json:"storedFilename"`
    URL            string    `json:"url"`
    Size           int64     `json:"size"`
    Tags           []string  `json:"tags"`
    CreatedAt      time.Time `json:"createdAt"`
}
```

Errors — including bind failures — return the shared `errors.Envelope(statusCode, message, error)`.

</details>

---

## Comments

### When to Comment

✅ **Do Comment**:
- **Why** code exists (business justification)
- **Complex algorithms** (explain approach)
- **Workarounds** (explain temporary fixes)
- **Public APIs** (JSDoc for documentation)

❌ **Don't Comment**:
- **What** code does (code should be self-explanatory)
- **Obvious statements**
- **Commented-out code** (use version control)

```typescript
// ✅ Good: Explains WHY
// Tags are stored as JSON because SQLite doesn't support arrays natively
@Column('simple-json')
tags: string[];

// ❌ Bad: Explains WHAT (obvious)
// Set tags to empty array
tags: string[] = [];
```

---

## Async/Await

Prefer `async/await` over callbacks or raw promises:

```typescript
// ✅ Good
async function uploadPhotos(files: File[]): Promise<Photo[]> {
  const results = await Promise.all(
    files.map(file => uploadPhoto(file, []))
  );
  return results;
}

// ❌ Bad: Callback pattern (use for legacy refactoring exercises only)
function uploadPhotos(files, callback) {
  let completed = 0;
  files.forEach(file => {
    uploadPhoto(file, (err, photo) => {
      if (++completed === files.length) {
        callback(null, photos);
      }
    });
  });
}
```

---

## Security

Validation happens in two places: **tag string validation** (shared logic) and **file upload validation** (size + MIME, backend-specific).

### Tag validation rules (same in every backend)

- Length 2–30 characters
- Lowercase alphanumeric with hyphens only: `/^[a-z0-9-]+$/`
- Max 20 tags per photo

### File Upload Validation

<details>
<summary><strong>NestJS (TypeScript)</strong></summary>

```typescript
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';

@UploadedFile(new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
    new FileTypeValidator({ fileType: /image\/(jpeg|png|gif|webp)/, fallbackToMimetype: true }),
  ],
})) file: Express.Multer.File,
```

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong></summary>

Declarative size limit in `application.yml`:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 10MB
```

MIME whitelist in the controller / service:

```java
private static final Set<String> ALLOWED_MIMES = Set.of(
    "image/jpeg", "image/png", "image/gif", "image/webp"
);

if (!ALLOWED_MIMES.contains(file.getContentType())) {
    throw new IllegalArgumentException("Unsupported media type: " + file.getContentType());
}
```

`MaxUploadSizeExceededException` and `IllegalArgumentException` are mapped to 400 with the shared error envelope in `GlobalExceptionHandler`.

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong></summary>

```python
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024

def _validate_upload(file: UploadFile) -> None:
    if file.size and file.size > MAX_FILE_SIZE:
        raise FileTooLargeError()
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedMediaTypeError()
```

Both custom exceptions are registered with `app.add_exception_handler(...)` to produce the 400 envelope.

</details>

<details>
<summary><strong>.NET (C#)</strong></summary>

```csharp
// Program.cs
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 5 * 1024 * 1024; // 5MB
});

// PhotosController.cs
private static readonly HashSet<string> AllowedMimes = new()
    { "image/jpeg", "image/png", "image/gif", "image/webp" };

if (!AllowedMimes.Contains(file.ContentType))
    return BadRequest(new ErrorEnvelope(400, "Unsupported media type", "Bad Request"));
```

`GlobalExceptionHandler` (via `IExceptionHandler`) maps uncaught exceptions to the `{ statusCode, message, error }` envelope. Model-state 400s get the same shape via `ApiBehaviorOptions.InvalidModelStateResponseFactory`.

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong></summary>

```go
var allowedMimes = map[string]struct{}{
    "image/jpeg": {}, "image/png": {}, "image/gif": {}, "image/webp": {},
}

if fh.Size > 5<<20 {
    c.JSON(400, errors.Envelope(400, "File size exceeds 5MB limit", "Bad Request")); return
}
if _, ok := allowedMimes[fh.Header.Get("Content-Type")]; !ok {
    c.JSON(400, errors.Envelope(400, "Unsupported media type", "Bad Request")); return
}
```

Also set `router.MaxMultipartMemory = 10 << 20` at startup.

</details>

---

## Performance

### Lazy Loading

```typescript
// ✅ Good: Lazy load images
<img [src]="photo.url" loading="lazy" [alt]="photo.filename" />
```

### Computed Values with Signals

```typescript
// ✅ Good: Computed values are memoized automatically
readonly tagStats = computed(() => {
  const photos = this.photosSignal();
  // Expensive computation only runs when photos change
  return calculateTagStats(photos);
});
```

---

## Git Conventions

### Commit Messages

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

```
✅ Good:
feat(upload): add tag support to photo upload
fix(validation): reject files over 5MB limit
refactor(storage): convert callbacks to async/await

❌ Bad:
"fixed bug"
"updates"
"wip"
```

### Branch Naming

```
feature/tag-filtering
bugfix/file-size-validation
refactor/async-storage
```

---

## References

- [architecture.md](architecture.md)
- [domain-glossary.md](domain-glossary.md)
- [testing-guidelines.md](testing-guidelines.md)
