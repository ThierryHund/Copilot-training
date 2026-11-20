# NestJS Backend (reference implementation)

- **Source**: [`apps/backend-nestjs/`](../../apps/backend-nestjs/)
- **Language**: TypeScript
- **Framework**: NestJS 11
- **ORM**: TypeORM with SQLite
- **Port**: 42621 (env var `NESTJS_BACKEND_PORT`)

This backend is the source of truth for the OpenAPI contract. All other backends must match it.

## Run

```sh
npm run serve:backend-nestjs
# Swagger UI: http://localhost:42621/api/docs
```

## Architecture

Four layers under `src/`:

```
api/photos/              # HTTP controllers + DTOs
domain/
  entities/              # @Entity classes (PhotoEntity)
  models/                # Domain models (Photo — also used as Swagger schema class)
  repositories/          # Repository interfaces (PhotoRepository, PHOTO_REPOSITORY token)
  services/              # Business logic (PhotoService)
infrastructure/
  repositories/          # TypeORM implementations (TypeOrmPhotoRepository)
  storage/               # File storage (legacy service kept for refactoring exercises)
```

The domain layer depends only on its own interfaces. Infrastructure implements those interfaces and wires them into the DI container via `PHOTO_REPOSITORY` token in `infrastructure.module.ts`.

## Key files

| File | Purpose |
|---|---|
| `src/main.ts` | Bootstrap — applies `api` global prefix, serves `/uploads/*`, wires Swagger at `/api/docs` |
| `src/openapi-export.ts` | Standalone script invoked by `npm run openapi:export` |
| `src/api/photos/photos.controller.ts` | The 5 HTTP endpoints, decorated with `@ApiOperation` / `@ApiResponse` / etc. |
| `src/domain/models/photo.model.ts` | `Photo` class decorated with `@ApiProperty` — acts as the response schema |
| `src/api/photos/dto/upload-photo.ts` | `UploadPhotoDto` — multipart schema for Swagger |

## Regenerating the OpenAPI spec

```sh
npm run openapi:export
```

Writes `docs/openapi.yaml` + `docs/openapi.json` from this backend's decorated controllers. Run after any change to endpoints, DTOs, or the `Photo` model.
