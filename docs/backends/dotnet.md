# .NET (C#) Backend

- **Source**: [`apps/backend-dotnet/`](../../apps/backend-dotnet/)
- **Language**: C# 12
- **Framework**: ASP.NET Core 8 (LTS)
- **ORM**: Entity Framework Core 8
- **Persistence**: SQLite via `Microsoft.EntityFrameworkCore.Sqlite`
- **Port**: 42621 (env var `DOTNET_BACKEND_PORT`)

## Run

```sh
npm run serve:backend-dotnet
# or
cd apps/backend-dotnet && dotnet run
# Swagger UI: http://localhost:42621/api/docs
```

First-time setup: `dotnet restore apps/backend-dotnet`. After that, `dotnet run` auto-restores.

## Architecture

Same hexagonal split as the other three alt backends:

```
apps/backend-dotnet/
├── Program.cs                              # DI wiring, middleware, Swagger, Kestrel port
├── Api/Photos/
│   ├── PhotosController.cs                 # [ApiController] [Route("api/photos")]
│   ├── GlobalExceptionHandler.cs           # IExceptionHandler → NestJS-shaped envelope
│   └── Dto/                                # PhotoResponse, UploadPhotoDto, DeleteResponse, ErrorEnvelope
├── Domain/
│   ├── Models/Photo.cs                     # Domain record (separate from EF entity)
│   ├── Services/{IPhotoService,PhotoService}.cs
│   └── Repositories/IPhotoRepository.cs
└── Infrastructure/
    ├── Data/AppDbContext.cs                # DbSet<PhotoEntity>; OnModelCreating applies JSON converter
    ├── Entities/PhotoEntity.cs             # [Table("photos")]; int Id primary key
    ├── Converters/StringListJsonConverter.cs
    ├── Repositories/EfPhotoRepository.cs
    └── Storage/{IDiskStorage,DiskStorage}.cs
```

The domain layer owns `Photo` (record) and the `IPhotoRepository` port; the infrastructure layer provides the EF Core implementation and the JSON converter. This separation is deliberate so the lab-103 N+1 scenario maps cleanly to EF Core idioms without leaking ORM concerns into the service.

## Why EF Core

The lab-103 collaborative-debug scenario walks trainees through an **N+1 query** bug and its fix. With EF Core, the fix is either:

- `.Include(p => p.Tags)` on the LINQ query for eager loading, OR
- `.Include(p => p.Tags).AsSplitQuery()` to avoid Cartesian explosion on large joins

This gives trainees a realistic .NET debugging scenario to work through, idiomatically equivalent to Hibernate's `@EntityGraph`, SQLAlchemy's `selectinload`, GORM's `Preload`, or TypeORM's `relations`.

## camelCase JSON out of the box

ASP.NET Core uses `System.Text.Json` with `JsonNamingPolicy.CamelCase` as the default. PascalCase C# properties (`StoredFilename`, `CreatedAt`) serialize to camelCase (`storedFilename`, `createdAt`) without any extra configuration — matches the response shape every other backend produces.

## Tags column

`PhotoEntity.Tags` is `List<string>` in C# but stored as a JSON-encoded `TEXT` column in SQLite via a `ValueConverter<List<string>, string>`:

```csharp
public class StringListJsonConverter : ValueConverter<List<string>, string>
{
    public StringListJsonConverter() : base(
        v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
        v => JsonSerializer.Deserialize<List<string>>(v ?? "[]", (JsonSerializerOptions?)null) ?? new List<string>())
    { }
}
```

Matches the NestJS `simple-json`, Hibernate `AttributeConverter`, SQLModel JSON text, and GORM `datatypes.JSON` approaches in the other backends.

## Error envelope

`GlobalExceptionHandler` (implementing `IExceptionHandler`, new in .NET 8) produces the same body shape as NestJS:

```json
{ "statusCode": 400, "message": "File size exceeds 5MB limit", "error": "Bad Request" }
```

`[ApiController]`'s automatic 400-on-ModelState is reshaped to this envelope via `ApiBehaviorOptions.InvalidModelStateResponseFactory` in `Program.cs`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DOTNET_BACKEND_PORT` | `42621` | HTTP port |
