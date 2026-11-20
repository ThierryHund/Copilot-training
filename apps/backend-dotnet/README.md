# Photo Gallery — .NET 8 Backend

Interchangeable ASP.NET Core 8 implementation of the photo-gallery backend.
Exposes the same HTTP contract as the NestJS, Spring Boot, FastAPI, and Gin
backends so the Angular frontend works unchanged against any of them.

## Prerequisites

- **.NET 8.0 SDK** (LTS; do not use the .NET 9 preview)
- No native dependencies — `Microsoft.Data.Sqlite` ships the bundled SQLite
  native library, so no extra C toolchain is required.

Verify with:

```bash
dotnet --version   # should print 8.0.x
```

## Run

From this directory:

```bash
dotnet run
```

From the workspace root (Nx / npm script target):

```bash
npm run serve:backend-dotnet
```

The server listens on **port 42621** (override with `DOTNET_BACKEND_PORT`). The
Angular dev proxy forwards `/api/*` and `/uploads/*` to this port, so selecting
the .NET backend requires no frontend changes.

On first start, the server:

1. Creates `./data/` and `./data/photogallery.db` (auto-migrated on boot via
   `EnsureCreated`).
2. Creates `./uploads/` for stored photo files.

## HTTP endpoints

Base path: `/api`

| Method | Path                         | Description                                       |
| ------ | ---------------------------- | ------------------------------------------------- |
| POST   | `/api/photos/upload`         | multipart `file` + optional `tags` form fields    |
| GET    | `/api/photos`                | List all photos, newest first                     |
| GET    | `/api/photos/{id}`           | Single photo — returns JSON `null` when missing   |
| POST   | `/api/photos/{id}/thumbnail` | Returns a plain JSON string thumbnail URL         |
| DELETE | `/api/photos/{id}`           | `{ "success": bool }` — false when id is unknown  |
| GET    | `/uploads/*`                 | Static files served from `./uploads/`             |
| GET    | `/api/health`                | Liveness probe                                    |

The canonical cross-backend contract lives at
[`../../docs/openapi.yaml`](../../docs/openapi.yaml).

## Swagger UI

Swagger UI is wired at **http://localhost:42621/api/docs**.
The OpenAPI JSON is available at **http://localhost:42621/api/v1/swagger.json**.

## Error envelope

Every failure response uses the shared envelope (matches NestJS / Spring /
FastAPI / Gin):

```json
{ "statusCode": 400, "message": "File size exceeds 5MB limit", "error": "Bad Request" }
```

Implemented via `IExceptionHandler` (new in .NET 8) in
`Api/Photos/GlobalExceptionHandler.cs`.

## Architecture

Hexagonal layering mirrors the NestJS reference backend so the four alt
backends diff cleanly against each other:

```
Program.cs                              entry point — DI wiring, Kestrel, Swagger, static files
Api/Photos/
├── PhotosController.cs                 HTTP layer: [ApiController] [Route("api/photos")]
├── GlobalExceptionHandler.cs           IExceptionHandler → shared error envelope
└── Dto/                                request/response DTOs (PhotoResponse, UploadPhotoDto, ...)
Domain/
├── Models/Photo.cs                     framework-agnostic domain types
├── Services/PhotoService.cs            business logic, talks only to IPhotoRepository
└── Repositories/IPhotoRepository.cs    port
Infrastructure/
├── Data/AppDbContext.cs                EF Core DbContext (SQLite)
├── Entities/PhotoEntity.cs             persistence entity ([Table("photos")])
├── Converters/StringListJsonConverter  List<string> ↔ JSON TEXT
├── Repositories/EfPhotoRepository.cs   EF Core adapter
└── Storage/DiskStorage.cs              IDiskStorage — unique {unixMillis}-{rand}.{ext}
```

Dependency direction: `Api → Domain ← Infrastructure`. Swapping storage
(PostgreSQL, in-memory, …) only requires a new repository adapter — the
service layer is unchanged.

## Tags persistence

Tags are persisted as a JSON TEXT column using EF Core's
`ValueConverter<List<string>, string>` (`StringListJsonConverter`). This
mirrors:

- NestJS / TypeORM `simple-json`
- Spring Boot Hibernate `AttributeConverter<List<String>, String>`
- FastAPI / SQLModel JSON text column
- Gin / GORM `datatypes.JSON` (`StringSlice`)

So the four backends share identical tag storage semantics.

## Lab-103 N+1 scenario

This backend is deliberately built with EF Core because the lab-103 ORM N+1
debug scenario (originally built against TypeORM) has a clean EF Core
counterpart. When the schema is extended with a related entity (e.g. a `Tag`
entity with a many-to-many relationship to `PhotoEntity`), the N+1 symptom
shows up identically in EF Core and the fix is familiar:

```csharp
// N+1: loads tags one photo at a time during serialization
var photos = await _dbContext.Photos.AsNoTracking().ToListAsync();

// Fix: eager-load in a single query
var photos = await _dbContext.Photos
    .AsNoTracking()
    .Include(p => p.Tags)
    .AsSplitQuery()       // optional — avoids Cartesian explosion with deeper graphs
    .ToListAsync();
```

This maps 1:1 onto the TypeORM `relations: { tags: true }`, Hibernate
`@EntityGraph`, SQLAlchemy `selectinload`, and GORM `Preload` fixes taught in
parallel across the other backends.

## Build artifacts

The `.gitignore` excludes `bin/`, `obj/`, `./uploads/`, `./data/`, and
`*.sqlite` files.
