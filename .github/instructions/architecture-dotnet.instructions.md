---
applyTo: 'apps/backend-dotnet/Domain/**'
---

# Architecture Instructions

Follow guidelines from references/architecture.md when working with domain layer code.

## Key Points for Domain Layer

- **Technology Stack**: ASP.NET Core 8 backend (C# 12), Entity Framework Core 8 with SQLite
- **Path**: `apps/backend-dotnet/Domain/`
- **Domain Model**: `Photo` is a plain mutable class with auto-properties — no EF Core attributes
- **Services**: Classes implementing an interface (e.g. `IPhotoService`), constructor-injected `IPhotoRepository`
- **Dependencies**: Domain layer should not depend on infrastructure — the EF Core `PhotoEntity` and `AppDbContext` live in `Infrastructure/`

## Domain Layer Structure

```txt
apps/backend-dotnet/Domain/
├── Models/
│ └── Photo.cs # Plain class, no attributes
├── Repositories/
│ └── IPhotoRepository.cs # Repository port
└── Services/
├── IPhotoService.cs
└── PhotoService.cs # Business logic
```

## Photo Domain Model Example

```csharp
public class Photo
{
    public int Id { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string StoredFilename { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long Size { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
```

## Validation Constraints

- Max file size: **5MB**
- Supported formats: JPEG, PNG, GIF, WebP
- Tags: lowercase alphanumeric with hyphens, max 20 tags, max 30 chars each

See [references/architecture.md](../references/architecture.md) for complete architecture documentation.