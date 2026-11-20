# Gin Backend

- **Source**: [`apps/backend-gin/`](../../apps/backend-gin/)
- **Language**: Go 1.23
- **Framework**: Gin
- **ORM**: GORM with SQLite (pure-Go driver `github.com/glebarez/sqlite` — no CGO required)
- **Port**: 42621 (env var `GIN_BACKEND_PORT`)

## Run

```sh
npm run serve:backend-gin
# or
cd apps/backend-gin && go run ./cmd/server
# Swagger UI: http://localhost:42621/api/docs  (via swaggo/gin-swagger)
```

First-time only, regenerate Swagger docs with:

```sh
cd apps/backend-gin
go run github.com/swaggo/swag/cmd/swag@latest init -g cmd/server/main.go -o ./docs
```

## Architecture

```
cmd/server/main.go                        # Entrypoint: router, DB, static, graceful shutdown
internal/
├── api/photos/
│   ├── handler.go                        # Gin handlers for all 5 endpoints
│   ├── dto.go                            # PhotoResponse with camelCase JSON tags
│   └── errors.go                         # Shared error envelope helper
├── domain/
│   ├── photo.go                          # Domain model
│   └── service.go                        # Business logic
└── infrastructure/
    ├── entity.go                         # GORM entity with snake_case columns
    ├── repository.go                     # GORM-backed repository
    ├── database.go                       # Open DB + AutoMigrate
    └── storage.go                        # Disk file storage helper
```

## Key detail — camelCase JSON with snake_case struct fields

GORM entities use snake_case column tags; the DTO uses JSON tags for camelCase output:

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

`ID` is serialized as a **string** (not number) to match the other backends.

## Tags column

`tags []string` is stored as a JSON-encoded `TEXT` column. Use `gorm.io/datatypes` JSON type or a custom `Scanner`/`Valuer` implementation. This matches NestJS's TypeORM `simple-json` behavior.

## Why GORM

The lab-103 N+1 debug scenario maps to GORM's `Preload("Tags")` — a concrete, language-idiomatic counterpart to TypeORM's `relations: ['tags']`. Gives trainees a realistic GORM-specific debugging exercise.

## Error envelope

Handlers return the NestJS-shaped error body:

```json
{ "statusCode": 400, "message": "File size exceeds 5MB limit", "error": "Bad Request" }
```
