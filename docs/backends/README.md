# Backend Implementations

The photo-gallery-fullstack workspace ships **four interchangeable backends** that all implement the same HTTP contract defined in [`../openapi.yaml`](../openapi.yaml). The Angular frontend is backend-agnostic — start any one of the four on port 42621 and the app works unchanged.

## Contract source of truth

[`docs/openapi.yaml`](../openapi.yaml) is regenerated from the NestJS backend via `npm run openapi:export`. Treat the NestJS implementation at [`apps/backend-nestjs/`](../../apps/backend-nestjs/) as the reference; the other three are conformant re-implementations. If you change the contract, change it in NestJS first, regenerate the spec, and update the other backends to match.

## Stacks at a glance

| Backend | Language | Framework | ORM | Package manager | Entry command |
|---|---|---|---|---|---|
| [`backend-nestjs`](nestjs.md) | TypeScript | NestJS 11 | TypeORM | npm | `npm run serve:backend-nestjs` |
| [`backend-spring`](spring.md) | Java 17 | Spring Boot 4 | Spring Data JPA + Hibernate | Maven | `npm run serve:backend-spring` |
| [`backend-fastapi`](fastapi.md) | Python 3.12 | FastAPI | SQLModel (SQLAlchemy) | uv / pip | `npm run serve:backend-fastapi` |
| [`backend-dotnet`](dotnet.md) | C# 12 | ASP.NET Core 8 | EF Core | dotnet CLI | `npm run serve:backend-dotnet` |
| [`backend-gin`](gin.md) | Go 1.23 | Gin | GORM | go modules | `npm run serve:backend-gin` |

All four bind **port 42621** (reading a stack-specific env var that defaults to 42621), persist to a local SQLite file, and store uploaded images on disk under `./uploads/`.

## Picking one

- **Default / fastest to run**: `backend-nestjs` — already wired into `npm run start`.
- **Enterprise Java familiarity**: `backend-spring`.
- **Python / data-science team**: `backend-fastapi`.
- **Microsoft / enterprise C# stack**: `backend-dotnet`.
- **Low-overhead / systems-oriented**: `backend-gin`.

Exactly one backend process may own port 42621 at a time. Stop whichever one is running before starting another.

## What must be identical across implementations

| Concern | Requirement |
|---|---|
| URL prefix | `/api` for app routes; `/uploads/<storedFilename>` for static assets |
| Response JSON shape | camelCase keys, `id` as string, `createdAt` as ISO 8601 — see `Photo` schema in `openapi.yaml` |
| Error envelope | `{ statusCode, message, error }` (matches NestJS default) |
| File upload limits | 5 MB max; `image/jpeg`, `image/png`, `image/gif`, `image/webp` only |
| Static serving | Uploaded files readable at `GET /uploads/<storedFilename>` |
| Ordering | `GET /api/photos` returns results ordered by `createdAt` **descending** |
| "Not found" semantics | `GET /api/photos/:id` returns JSON `null` (not 404); `DELETE` returns `{ "success": false }` |

These are non-negotiable: the Angular frontend (and the agent/skill flows in `.claude/` / `.github/` / `.gemini/`) assume them.

## Regenerating `openapi.yaml`

```sh
npm run openapi:export
```

This boots a non-listening NestJS context, walks the decorated controllers/DTOs, serializes to YAML + JSON, and writes to `docs/openapi.yaml` + `docs/openapi.json`. If a diff appears, commit it — it represents a contract change all four backends must honor.
