# Photo Gallery Testing Guidelines

## Testing Philosophy

**Goal**: High confidence in system behavior with maintainable, fast-executing tests.

**Principles**:
- Tests describe **what** the code does, not **how** it does it
- Fast feedback loop (unit tests <5s, integration tests <30s)
- Test behavior, not implementation details
- Prioritize tests that catch real bugs

---

## Testing Pyramid

### Unit Tests (70% of tests)

**Scope**: Individual functions, classes, components in isolation
**Speed**: Milliseconds
**Dependencies**: Mocked

**Coverage Target**: 80%+ for business logic

**Example**:
```typescript
describe('PhotoValidator', () => {
  it('should reject files larger than 5MB', () => {
    const file = { size: 6 * 1024 * 1024, type: 'image/jpeg' };
    const result = validatePhotoFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('File size exceeds 5MB');
  });

  it('should accept valid image files', () => {
    const file = { size: 2 * 1024 * 1024, type: 'image/jpeg' };
    const result = validatePhotoFile(file);

    expect(result.valid).toBe(true);
  });
});
```

---

### Integration Tests (20% of tests)

**Scope**: Multiple modules working together (API + database, service + repository)
**Speed**: Seconds
**Dependencies**: Real (test database, file system)

**Coverage Target**: All critical paths

<details>
<summary><strong>NestJS (Vitest + supertest)</strong></summary>

```typescript
describe('Photo API (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  it('should upload photo and return metadata', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/photos/upload')
      .attach('file', 'test-fixtures/sample.jpg')
      .field('tags', 'test,fixture')
      .expect(201);
    expect(response.body).toMatchObject({ filename: 'sample.jpg', tags: ['test', 'fixture'] });
  });
});
```

</details>

<details>
<summary><strong>Spring Boot (JUnit 5 + MockMvc)</strong></summary>

```java
@SpringBootTest
@AutoConfigureMockMvc
class PhotosControllerIT {
    @Autowired MockMvc mvc;

    @Test
    void uploadPhotoReturnsMetadata() throws Exception {
        var file = new MockMultipartFile("file", "sample.jpg",
            "image/jpeg", Files.readAllBytes(Path.of("test-fixtures/sample.jpg")));
        mvc.perform(multipart("/api/photos/upload")
                .file(file)
                .param("tags", "test,fixture"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.filename").value("sample.jpg"))
            .andExpect(jsonPath("$.tags", contains("test", "fixture")));
    }
}
```

</details>

<details>
<summary><strong>FastAPI (pytest + httpx)</strong></summary>

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_upload_photo_returns_metadata(tmp_path):
    with open("test-fixtures/sample.jpg", "rb") as f:
        response = client.post(
            "/api/photos/upload",
            files={"file": ("sample.jpg", f, "image/jpeg")},
            data={"tags": "test,fixture"},
        )
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "sample.jpg"
    assert body["tags"] == ["test", "fixture"]
```

</details>

<details>
<summary><strong>.NET (xUnit + <code>WebApplicationFactory&lt;Program&gt;</code>)</strong></summary>

```csharp
public class PhotosControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public PhotosControllerIntegrationTests(WebApplicationFactory<Program> factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task UploadPhoto_ReturnsMetadata()
    {
        using var content = new MultipartFormDataContent();
        var fileBytes = await File.ReadAllBytesAsync("test-fixtures/sample.jpg");
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(fileContent, "file", "sample.jpg");
        content.Add(new StringContent("test,fixture"), "tags");

        var response = await _client.PostAsync("/api/photos/upload", content);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PhotoResponse>();
        Assert.Equal("sample.jpg", body!.Filename);
        Assert.Equal(new[] { "test", "fixture" }, body.Tags);
    }
}
```

</details>

<details>
<summary><strong>Gin (Go test + httptest)</strong></summary>

```go
func TestUploadPhoto_ReturnsMetadata(t *testing.T) {
    router := setupRouter()   // same wiring as cmd/server/main.go

    body := &bytes.Buffer{}
    w := multipart.NewWriter(body)
    part, _ := w.CreateFormFile("file", "sample.jpg")
    f, _ := os.Open("test-fixtures/sample.jpg")
    io.Copy(part, f)
    w.WriteField("tags", "test,fixture")
    w.Close()

    req := httptest.NewRequest("POST", "/api/photos/upload", body)
    req.Header.Set("Content-Type", w.FormDataContentType())
    rec := httptest.NewRecorder()
    router.ServeHTTP(rec, req)

    if rec.Code != 201 { t.Fatalf("got %d", rec.Code) }
    var got dto.PhotoResponse
    json.Unmarshal(rec.Body.Bytes(), &got)
    if got.Filename != "sample.jpg" { t.Errorf("filename = %q", got.Filename) }
}
```

</details>

---

### E2E Tests (10% of tests)

**Scope**: Complete user workflows through UI
**Speed**: 10-30 seconds per test
**Dependencies**: Real (full stack running)

**Coverage Target**: Critical user journeys only

**Example**:
```typescript
test('user can upload and view photo', async ({ page }) => {
  await page.goto('/');

  // Upload a photo
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('fixtures/sample.jpg');

  // Add tags
  const tagInput = page.locator('input[placeholder*="tag"]');
  await tagInput.fill('vacation');
  await page.keyboard.press('Enter');

  // Submit upload
  await page.click('button:has-text("Upload")');

  // Verify photo appears in grid
  await expect(page.locator('.photo-card')).toBeVisible();
  await expect(page.locator('.photo-card img')).toHaveAttribute('alt', /sample/i);
});
```

---

## Test Structure (AAA Pattern)

### Arrange-Act-Assert

```typescript
it('should calculate total storage used', () => {
  // Arrange: Set up test data
  const photos = [
    { id: '1', size: 1024 },
    { id: '2', size: 2048 },
  ];

  // Act: Execute the code under test
  const total = photos.reduce((sum, p) => sum + p.size, 0);

  // Assert: Verify the outcome
  expect(total).toBe(3072);
});
```

---

## Mocking Strategy

### When to Mock

✅ **Mock**:
- HTTP calls to backend API
- File system operations in unit tests
- Non-deterministic behavior (Date.now(), random generators)
- Side effects (console output)

❌ **Don't Mock**:
- Simple utilities (string formatters, math functions)
- Domain logic you're trying to test
- Framework internals (leads to brittle tests)

### Mock Examples

```typescript
// ✅ Good: Mock HTTP client
const mockApiService = {
  uploadPhoto: vi.fn().mockResolvedValue({ id: 1, url: '/uploads/photo.jpg' }),
};

// ✅ Good: Mock date for deterministic tests
vi.useFakeTimers().setSystemTime(new Date('2025-01-17'));

// ❌ Bad: Over-mocking makes test meaningless
const mockPhoto = {
  isValid: vi.fn().mockReturnValue(true),
};
// Test just verifies mock was called, not actual validation logic
```

---

## Test Naming

### Descriptive Test Names

Format: `should [expected behavior] when [condition]`

```typescript
// ✅ Good
it('should return 404 when photo does not exist', ...)
it('should reject upload when file exceeds 5MB', ...)
it('should filter photos when multiple tags selected', ...)

// ❌ Bad
it('works', ...)
it('test upload', ...)
it('should call photoService', ...) // Tests implementation, not behavior
```

---

## Test Data Management

### Test Fixtures

Store reusable test data in `tests/fixtures/`:

```typescript
// tests/fixtures/photos.ts
export const validPhoto = {
  id: 1,
  filename: 'test-photo.jpg',
  storedFilename: '1705484523456-x7g2h-test-photo.jpg',
  url: '/uploads/1705484523456-x7g2h-test-photo.jpg',
  size: 1024,
  tags: ['test'],
  createdAt: new Date('2025-01-17'),
};

export const invalidPhoto = {
  ...validPhoto,
  size: 6 * 1024 * 1024, // Exceeds 5MB limit
};
```

### Factory Functions

```typescript
function createTestPhoto(overrides?: Partial<Photo>): Photo {
  return {
    id: Date.now().toString(),
    filename: 'test-photo.jpg',
    dataUrl: 'data:image/jpeg;base64,/9j/...',
    uploadedAt: new Date(),
    tags: [],
    size: 1024,
    ...overrides,
  };
}

// Usage:
const photo = createTestPhoto({ tags: ['vacation', 'beach'] });
```

---

## Coverage Targets

### Code Coverage Goals

| Category | Target | Priority |
|----------|--------|----------|
| Business Logic | 90%+ | CRITICAL |
| API Controllers | 80%+ | HIGH |
| Services | 85%+ | HIGH |
| UI Components | 70%+ | MEDIUM |
| Utilities | 95%+ | MEDIUM |
| Infrastructure | 60%+ | LOW |

### Coverage is Not a Goal

**Good**: 70% coverage with meaningful tests
**Bad**: 95% coverage with brittle, meaningless tests

Focus on **behavior coverage** (what users care about), not **line coverage** (what tools measure).

---

## Test Execution

### Local Development

Frontend (always the same):

```bash
nx test frontend           # unit
nx test frontend --watch   # watch mode
nx test frontend --coverage
nx e2e frontend-e2e        # Playwright
```

Backend — pick the commands matching your chosen backend:

<details>
<summary><strong>NestJS</strong></summary>

```bash
nx test backend-nestjs             # Vitest unit + integration
nx test backend-nestjs --watch
nx test backend-nestjs --coverage
```

</details>

<details>
<summary><strong>Spring Boot</strong></summary>

```bash
cd apps/backend-spring
./mvnw test                         # JUnit
./mvnw verify                       # JUnit + coverage via jacoco
./mvnw -Dtest=PhotosControllerTest test
```

</details>

<details>
<summary><strong>FastAPI</strong></summary>

```bash
cd apps/backend-fastapi
uv run pytest                       # all tests
uv run pytest -k upload             # filter
uv run pytest --cov=app --cov-report=term-missing
```

</details>

<details>
<summary><strong>.NET</strong></summary>

```bash
cd apps/backend-dotnet
dotnet test                                                # all tests
dotnet test --filter "FullyQualifiedName~Photos"           # filter
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=lcov
```

</details>

<details>
<summary><strong>Gin</strong></summary>

```bash
cd apps/backend-gin
go test ./...                       # all packages
go test ./internal/api/photos/      # one package
go test ./... -cover
go test ./... -race                 # race detector
```

</details>

### CI Pipeline

Tests run automatically on every PR:
1. **Lint** (fails fast): 10 seconds
2. **Unit tests**: 30 seconds
3. **Integration tests**: 2 minutes
4. **E2E tests** (critical paths only): 5 minutes

**Total CI time**: <8 minutes

---

## Test Isolation

### Each Test Should Be Independent

```typescript
// ✅ Good: Clean setup per test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset signals/state
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ❌ Bad: Shared state between tests
let sharedPhoto; // Don't do this!

test('upload photo', () => {
  sharedPhoto = uploadPhoto(); // Affects next test
});

test('delete photo', () => {
  deletePhoto(sharedPhoto); // Depends on previous test
});
```

---

## Angular Signal Testing

### Testing Components with Signals

```typescript
describe('PhotoListComponent', () => {
  it('should filter photos by selected tags', () => {
    // Arrange
    const component = new PhotoListComponent();
    const mockPhotos = [
      createTestPhoto({ tags: ['vacation', 'beach'] }),
      createTestPhoto({ tags: ['work'] }),
    ];

    // Inject mock photos
    Object.defineProperty(component, 'photos', {
      value: () => mockPhotos,
    });

    // Act
    component.selectedTags.set(['vacation']);

    // Assert
    expect(component.filteredPhotos().length).toBe(1);
    expect(component.filteredPhotos()[0].tags).toContain('vacation');
  });
});
```

---

## Backend Controller/Handler Unit Testing

Controllers/handlers are the thinnest slice in the hexagonal layout — the test pattern is the same in every backend: stub the service, exercise one method, assert the mapped response.

<details>
<summary><strong>NestJS (Vitest)</strong></summary>

```typescript
describe('PhotosController', () => {
  let controller: PhotosController;
  const mockPhotoService = {
    getPhotos: vi.fn().mockResolvedValue([]),
    uploadPhoto: vi.fn(),
    deletePhoto: vi.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [{ provide: PhotoService, useValue: mockPhotoService }],
    }).compile();
    controller = module.get(PhotosController);
  });

  it('returns all photos', async () => {
    mockPhotoService.getPhotos.mockResolvedValue([{ id: '1', filename: 'test.jpg' }]);
    expect(await controller.getPhotos()).toHaveLength(1);
  });
});
```

</details>

<details>
<summary><strong>Spring Boot (JUnit 5 + Mockito)</strong></summary>

```java
@WebMvcTest(PhotosController.class)
class PhotosControllerTest {
    @Autowired MockMvc mvc;
    @MockBean PhotoService photoService;

    @Test
    void returnsAllPhotos() throws Exception {
        when(photoService.getPhotos()).thenReturn(List.of(
            new PhotoResponse("1", "test.jpg", "stored.jpg", "/uploads/stored.jpg", 100L, List.of(), Instant.now())
        ));
        mvc.perform(get("/api/photos"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].filename").value("test.jpg"));
    }
}
```

</details>

<details>
<summary><strong>FastAPI (pytest + monkeypatch / Depends override)</strong></summary>

```python
def test_returns_all_photos():
    async def fake_service():
        return [PhotoResponse(id="1", filename="test.jpg", stored_filename="s.jpg",
                              url="/uploads/s.jpg", size=100, tags=[], created_at=datetime.utcnow())]
    app.dependency_overrides[get_photo_service] = lambda: StubService(list_photos=fake_service)
    try:
        response = client.get("/api/photos")
        assert response.status_code == 200
        assert response.json()[0]["filename"] == "test.jpg"
    finally:
        app.dependency_overrides.clear()
```

</details>

<details>
<summary><strong>.NET (xUnit + Moq)</strong></summary>

```csharp
public class PhotosControllerTests
{
    [Fact]
    public async Task GetPhotos_ReturnsList()
    {
        var mockService = new Mock<IPhotoService>();
        mockService.Setup(s => s.GetPhotosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PhotoResponse>
            {
                new("1", "test.jpg", "stored.jpg", "/uploads/stored.jpg", 100, new(), DateTime.UtcNow)
            });

        var controller = new PhotosController(mockService.Object);
        var result = await controller.GetPhotos(CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var photos = Assert.IsAssignableFrom<IEnumerable<PhotoResponse>>(okResult.Value);
        Assert.Single(photos);
    }
}
```

</details>

<details>
<summary><strong>Gin (Go test + stub service)</strong></summary>

```go
type stubService struct{ photos []dto.PhotoResponse }
func (s *stubService) ListPhotos(ctx context.Context) ([]dto.PhotoResponse, error) { return s.photos, nil }

func TestGetPhotos_ReturnsList(t *testing.T) {
    h := photos.NewHandler(&stubService{photos: []dto.PhotoResponse{{ID: "1", Filename: "test.jpg"}}})
    r := gin.New()
    photos.RegisterRoutes(r.Group("/api"), h)

    req := httptest.NewRequest("GET", "/api/photos", nil)
    rec := httptest.NewRecorder()
    r.ServeHTTP(rec, req)

    if rec.Code != 200 { t.Fatalf("got %d", rec.Code) }
    var got []dto.PhotoResponse
    _ = json.Unmarshal(rec.Body.Bytes(), &got)
    if got[0].Filename != "test.jpg" { t.Error("unexpected filename") }
}
```

</details>

---

## Visual Regression Testing

Use Playwright for visual diffs:

```typescript
test('photo card should render correctly', async ({ page }) => {
  await page.goto('/');

  // Wait for photos to load
  await page.waitForSelector('.photo-card');

  const photoCard = page.locator('.photo-card').first();
  await expect(photoCard).toHaveScreenshot('photo-card.png');
});
```

---

## Flaky Test Prevention

### Common Causes of Flakiness

1. **Race Conditions**: Use proper wait conditions
2. **Timing Dependencies**: Avoid hardcoded `setTimeout`
3. **External Dependencies**: Mock unreliable services
4. **Test Pollution**: Clean up after each test

### Debugging Flaky Tests

```bash
# Run test multiple times to reproduce flakiness
nx test frontend -- --repeat 100

# Run with debug output
DEBUG=* nx test frontend
```

---

## References

- **Architecture**: [architecture.md](architecture.md)
- **Coding Standards**: [coding-standards.md](coding-standards.md)
- **Domain Glossary**: [domain-glossary.md](domain-glossary.md)
