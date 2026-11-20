# Photo Gallery — Gin Backend

Interchangeable Go/Gin implementation of the photo-gallery backend. Exposes the
same HTTP contract as the NestJS, Spring Boot, and FastAPI backends, so the
Angular frontend works unchanged against any of them.

## Prerequisites

- **Go 1.23+**
- **No CGO required.** This backend uses the pure-Go SQLite driver
  [`github.com/glebarez/sqlite`](https://github.com/glebarez/sqlite), so you
  do not need a C toolchain. If you prefer the mattn/go-sqlite3 driver, swap
  `gorm.io/driver/sqlite` into `internal/infrastructure/database.go` and add it
  to `go.mod` — but that requires CGO.
- **swag CLI** (optional, only needed to regenerate the Swagger UI spec):
  ```bash
  go install github.com/swaggo/swag/cmd/swag@latest
  ```

## Run

From this directory:

```bash
cp .env.example .env        # optional — default port 42621 is baked in
go run ./cmd/server
```

From the workspace root (Nx target):

```bash
npm run serve:backend-gin
```

The server listens on **port 42621** (override via `GIN_BACKEND_PORT`). The
Angular frontend dev proxy forwards `/api/*` and `/uploads/*` to this port, so
selecting the Gin backend requires no frontend changes.

On first start, the server:

1. Creates `./db/` and opens / migrates `./db/photos.sqlite`.
2. Creates `./uploads/` for stored photo files.

## HTTP endpoints

Base path: `/api`

| Method | Path                         | Description                                       |
| ------ | ---------------------------- | ------------------------------------------------- |
| POST   | `/api/photos/upload`         | multipart `file` + optional `tags` form fields    |
| GET    | `/api/photos`                | List all photos, newest first                     |
| GET    | `/api/photos/:id`            | Single photo — returns JSON `null` when missing   |
| POST   | `/api/photos/:id/thumbnail`  | Returns a plain JSON string thumbnail URL         |
| DELETE | `/api/photos/:id`            | `{ "success": bool }`                             |
| GET    | `/uploads/*`                 | Static files served from `./uploads/`             |
| GET    | `/api/health`                | Liveness probe                                    |

The canonical cross-backend contract lives at
[`../../docs/openapi.yaml`](../../docs/openapi.yaml).

## Swagger UI

Swagger is wired at **http://localhost:42621/api/docs/index.html**. The UI is
served live by `gin-swagger`; to populate the spec, generate the docs package
before running:

```bash
swag init -g cmd/server/main.go -o ./docs
# then uncomment the blank import in cmd/server/main.go:
#   _ "github.com/photo-gallery/backend-gin/docs"
go run ./cmd/server
```

## Architecture

Mirrors the NestJS hexagonal layering so the four reference backends are easy
to diff against each other.

```
cmd/server/main.go           entry point — wires router, DB, static, shutdown
internal/
├── api/photos/              HTTP layer (controllers, DTOs, error envelope)
├── domain/                  business logic — framework-agnostic
└── infrastructure/          GORM repository, SQLite bootstrap, disk storage
```

Dependency direction: `api → domain ← infrastructure`. The domain layer
defines `PhotoRepository` as an interface; the infrastructure layer provides a
GORM-backed implementation. Swapping storage (Postgres, in-memory, …) only
requires a new adapter — the service layer is unchanged.

**Why GORM?** The lab-103 ORM N+1 scenario from the NestJS track maps directly
onto GORM's `Preload` mechanism, so exercises remain portable across backends.

## Build artifacts

The `.gitignore` excludes `./uploads/`, `./db/`, `./docs/` (swag output) and
`go.sum` (generated at build time).
