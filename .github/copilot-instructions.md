# Photo Gallery Repository Instructions

Follow these guidelines when working in this repository:

## Architecture & Design

- Follow the layered architecture defined in [references/architecture.md](references/architecture.md)
- Respect module boundaries (UI → Service → Domain → Infrastructure)
- Use dependency injection for all external dependencies
- Reference [references/domain-glossary.md](references/domain-glossary.md) for consistent terminology

## Technology Stack

- **Frontend**: Angular 20+ with signals-based state management
- **Database**: SQLite (local file)
- **File Storage**: Local disk (`./dist/uploads/`)
- **Backend**: see the backend-specific block below for your chosen stack

## Coding Standards

- TypeScript for the frontend (strict mode enabled); the backend follows its own stack's idiomatic conventions (see below)
- Use async/await (no callbacks except for legacy refactoring exercises)
- Functions max 50 lines
- Classes follow single responsibility principle
- See [references/coding-standards.md](references/coding-standards.md) for detailed conventions

### Angular (Frontend)

**Path**: `apps/frontend/src/app/`

- Use standalone components (no NgModules)
- Use Angular signals for state (`signal()`, `computed()`)
- Use `inject()` function for dependency injection

​`typescript
@Component({
  standalone: true,
  imports: [CommonModule],
})
export class PhotoListComponent {
  private readonly photoService = inject(PhotoService);
  readonly photos = this.photoService.photos;
  readonly selectedTags = signal<string[]>([]);
}
​`

### .NET (Backend)

**Technology Stack**: ASP.NET Core 8 (C# 12) with Entity Framework Core 8 (.NET 8 SDK)
**Key Paths**: API `apps/backend-dotnet/Api/`, Domain `apps/backend-dotnet/Domain/`, Infrastructure `apps/backend-dotnet/Infrastructure/`

- Use `[ApiController]` with constructor-injected interfaces (e.g. `IPhotoService`)
- Use Entity Framework Core for database access via the repository pattern — no raw SQL
- Use DTOs relying on `System.Text.Json`'s default camelCase policy

​```csharp
[ApiController]
[Route("api/photos")]
public class PhotosController : ControllerBase
{
private readonly IPhotoService \_photoService;

public PhotosController(IPhotoService photoService) => \_photoService = photoService;

[HttpGet]
public async Task<IEnumerable<PhotoResponse>> GetPhotos() => await \_photoService.GetPhotosAsync();
}
​```

## Testing

- Minimum 80% code coverage for business logic
- Use AAA pattern (Arrange-Act-Assert)
- Mock external dependencies (HTTP calls, file system in unit tests)
- Use Vitest for unit and integration tests
- Use Playwright for E2E tests
- See [references/testing-guidelines.md](references/testing-guidelines.md) for test strategies

## API Conventions

- RESTful endpoints with proper HTTP verbs
- camelCase for JSON fields
- Consistent error response format:
  ```json
  {
    "statusCode": 400,
    "message": "File size exceeds 5MB limit",
    "error": "Bad Request"
  }
  ```

## Validation Constraints

- Max file size: **5MB**
- Supported image types: JPEG, PNG, GIF, WebP
- Tags: lowercase alphanumeric with hyphens, max 20 tags, max 30 chars each

## Security

- Always validate and sanitize user input
- Use your ORM's repository/query-builder methods (avoid raw SQL)
- Store sensitive data in environment variables
- No hardcoded credentials or API keys

## Performance

- Use Angular signals for reactive state (automatically optimized)
- Lazy load images with `loading="lazy"` attribute
- Use computed values for derived state (memoized automatically)
- Optimize database queries using your backend's query builder/ORM

## Git Workflow

- Branch naming: `feature/`, `bugfix/`, `refactor/`
- Commit messages: `type(scope): description`
- PR descriptions include test strategy and deployment notes
- Code review required from 2+ team members

## On-Call & Incidents

- Follow escalation procedures in [references/oncall.md](references/oncall.md)
- Document incidents using RCA template
- Update runbooks with learnings

When in doubt, reference the comprehensive documentation in the `references/` directory or consult relevant team agents.