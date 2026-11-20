# Photo Gallery — Spring Boot backend

One of four interchangeable backends (NestJS, Spring Boot, FastAPI, Gin)
implementing the same HTTP contract for the Photo Gallery Angular frontend.
See the canonical OpenAPI spec at [`../../docs/openapi.yaml`](../../docs/openapi.yaml).

## Stack

- **Java 17**
- **Spring Boot 3.3.x** — the requested Spring Boot 4 milestones are not yet
  widely available in public Maven Central. The `pom.xml` is parented on the
  stable `3.3.4` release. To switch to a milestone build once available,
  change the parent version and uncomment the `spring-milestones` repositories
  at the bottom of `pom.xml`.
- **Spring Data JPA + Hibernate** (ORM)
- **SQLite** via `org.xerial:sqlite-jdbc` using the `SQLiteDialect` from
  `hibernate-community-dialects`
- **Maven** (wrapper included)
- **springdoc-openapi** (Swagger UI)
- **Jakarta Bean Validation**

## Architecture

Four-layer hexagonal style, mirroring the NestJS reference backend:

```
api              -> HTTP controllers, DTOs, exception handler
 └── photos
domain           -> model records, services, repository port
 ├── model
 ├── repository  (Spring Data JPA interface)
 └── service
infrastructure   -> JPA entity, static resource config
 ├── entity
 └── config
```

The domain layer holds business logic and owns the repository port; the
infrastructure layer provides concrete persistence (JPA entity + converter).
This separation makes it straightforward to swap persistence or to evolve
the entity graph (e.g. for the lab-103 N+1 debugging scenario, adding
an `@OneToMany` to `PhotoEntity` will surface lazy-loading pitfalls on the
existing domain service without touching the controller layer).

## Prerequisites

- Java 17 or newer (`java -version` must report 17+)
- Maven 3.9+ — or simply use the bundled wrapper (`./mvnw`).
  If the wrapper JAR (`.mvn/wrapper/maven-wrapper.jar`) is missing, either
  - run `mvn -N wrapper:wrapper` once to regenerate it, or
  - use your system Maven: `mvn spring-boot:run`.

## Run

```bash
# From this directory
./mvnw spring-boot:run

# Or package and run the fat jar
./mvnw package
java -jar target/backend-spring-1.0.0.jar
```

The service binds to port **42621** by default. Override with the
`SPRING_BACKEND_PORT` env var:

```bash
SPRING_BACKEND_PORT=8080 ./mvnw spring-boot:run
```

## Endpoints

Base URL: `http://localhost:42621/api`

| Method | Path                             | Purpose                          |
| ------ | -------------------------------- | -------------------------------- |
| POST   | `/api/photos/upload`             | Upload a photo (multipart)       |
| GET    | `/api/photos`                    | List photos (newest first)       |
| GET    | `/api/photos/{id}`               | Get one photo (null body if 404) |
| POST   | `/api/photos/{id}/thumbnail`     | Get thumbnail URL (plain string) |
| DELETE | `/api/photos/{id}`               | Delete a photo                   |
| GET    | `/uploads/{storedFilename}`      | Serve the raw file               |

- Swagger UI: <http://localhost:42621/api/docs>
- OpenAPI JSON: <http://localhost:42621/api/v3/api-docs>

## Storage layout

- SQLite DB: `./data/photogallery.db`
- Uploaded files: `./uploads/{epochMillis}-{random}.{ext}`

Both directories are created on startup as needed. They are excluded via
`.gitignore`.

## Environment variables

| Variable                  | Default               | Description                       |
| ------------------------- | --------------------- | --------------------------------- |
| `SPRING_BACKEND_PORT`     | `42621`               | HTTP port                         |
| `PHOTOGALLERY_UPLOADS_DIR`| `./uploads`           | Directory used for uploaded files |

## Notes for the lab-103 N+1 scenario

Because persistence is handled by Hibernate, introducing an `@OneToMany`
(or `@ManyToMany`) association on `PhotoEntity` with the default
`FetchType.LAZY` will produce the classic N+1 query pattern when
`PhotoService.getPhotos()` maps each entity to the domain record. Candidate
fixes: `@EntityGraph` on the repository method, a JPQL `JOIN FETCH`, or
`@BatchSize`. This backend is wired with `spring.jpa.open-in-view=false`
so lazy-loading outside the transactional boundary fails fast — exactly
the behaviour you want during that lab.
