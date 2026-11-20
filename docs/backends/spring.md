# Spring Boot Backend

- **Source**: [`apps/backend-spring/`](../../apps/backend-spring/)
- **Language**: Java 17
- **Framework**: Spring Boot 3.3.4 (stable). Spring Boot 4 is the target once GA — `pom.xml` includes commented-out `spring-milestones` repositories and a note for trainees to bump the parent version when an M1/GA becomes available.
- **ORM**: Spring Data JPA backed by Hibernate
- **Persistence**: SQLite via `org.xerial:sqlite-jdbc` + Hibernate community `SQLiteDialect`
- **Port**: 42621 (env var `SPRING_BACKEND_PORT`)

## Run

```sh
npm run serve:backend-spring
# or
cd apps/backend-spring && ./mvnw spring-boot:run
# Swagger UI: http://localhost:42621/api/docs
```

## Architecture

```
src/main/java/com/photogallery/backend/
├── api/photos/
│   ├── PhotosController.java          # HTTP endpoints
│   ├── dto/                           # Request/response DTOs
│   └── GlobalExceptionHandler.java    # @RestControllerAdvice — NestJS-shaped error envelope
├── domain/
│   ├── model/Photo.java               # Domain model (separate from JPA entity)
│   ├── service/PhotoService.java      # Business logic
│   └── repository/PhotoRepository.java# Spring Data JPA interface
└── infrastructure/
    ├── entity/PhotoEntity.java        # @Entity, @Column, AttributeConverter<List<String>, String>
    └── config/StaticResourceConfig.java # Serves /uploads/** from the local uploads directory
```

## Why Hibernate

The lab-103 collaborative-debug exercise walks trainees through an **N+1 query** bug and its fix. With Hibernate, the fix uses `@EntityGraph` or `JOIN FETCH` — a concrete, language-idiomatic counterpart to TypeORM's `relations: ['tags']` in NestJS. This gives trainees a realistic JPA/Hibernate debugging scenario to work through.

## Error envelope

`GlobalExceptionHandler` translates common exceptions into the same body as NestJS:

```json
{ "statusCode": 400, "message": "File size exceeds 5MB limit", "error": "Bad Request" }
```

Handlers cover: `MethodArgumentNotValidException`, `MaxUploadSizeExceededException`, `HttpMessageNotReadableException`, and an `IllegalArgumentException` fallback.

## Tags column

`PhotoEntity.tags` is `List<String>` in Java but stored as a JSON-encoded `TEXT` column in SQLite, via an `AttributeConverter`. This matches TypeORM's `simple-json` behavior in the NestJS backend.
