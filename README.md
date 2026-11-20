# Photo Gallery Fullstack

A fullstack photo gallery application built with Nx monorepo, featuring an Angular frontend and a **choice of five interchangeable backends** (NestJS, Spring Boot, FastAPI, .NET, or Gin). Persistence via SQLite.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 20, TypeScript, Vitest |
| Backend (reference) | NestJS 11, TypeORM, SQLite |
| Backend (alt) | Java 17 + Spring Boot 4 + Hibernate, Python 3.12 + FastAPI + SQLModel, C# 12 + ASP.NET Core 8 + EF Core, Go 1.23 + Gin + GORM |
| API contract | OpenAPI 3 — see [`docs/openapi.yaml`](docs/openapi.yaml) |
| Monorepo | Nx 21.4 |
| Testing | Vitest (unit), Playwright (e2e) |

## Project Structure

```
photo-gallery-fullstack/
├── apps/
│   ├── frontend/              # Angular application
│   ├── backend-nestjs/        # NestJS 11 API server (reference implementation)
│   ├── backend-spring/        # Java 17 + Spring Boot 4 implementation
│   ├── backend-fastapi/       # Python 3.12 + FastAPI implementation
│   ├── backend-dotnet/        # C# 12 + ASP.NET Core 8 implementation
│   └── backend-gin/           # Go 1.23 + Gin implementation
├── docs/
│   ├── openapi.yaml           # Canonical HTTP API contract (generated from NestJS)
│   └── backends/              # Per-stack implementation guides
├── .claude/                   # Claude Code agents & commands
├── .github/                   # GitHub Copilot agents & prompts
├── .gemini/                   # Gemini CLI commands
├── AGENTS.md                  # Cross-platform agent reference
├── CLAUDE.md                  # Claude Code setup guide
└── GEMINI.md                  # Gemini CLI setup guide
```

## Quick Start

```sh
# Install Node dependencies
npm ci

# Start frontend + NestJS backend (default)
npm run start
```

The frontend is served at `http://localhost:42410` and proxies `/api/*` + `/uploads/*` to port 42411. All four backends bind that same port, so the frontend is backend-agnostic — start whichever one you want.

## Backend Implementation Options

Pick **one** backend per run. All implement the same OpenAPI contract (`docs/openapi.yaml`) and bind port 42411.

<details>
<summary><strong>NestJS (TypeScript) — reference implementation</strong></summary>

```sh
npm run serve:backend-nestjs
# Swagger UI at http://localhost:42411/api/docs
```

See [`docs/backends/nestjs.md`](docs/backends/nestjs.md) and [`apps/backend-nestjs/`](apps/backend-nestjs/).

</details>

<details>
<summary><strong>Spring Boot (Java 17)</strong></summary>

```sh
npm run serve:backend-spring
# or: cd apps/backend-spring && ./mvnw spring-boot:run
```

See [`docs/backends/spring.md`](docs/backends/spring.md) and [`apps/backend-spring/`](apps/backend-spring/).

</details>

<details>
<summary><strong>FastAPI (Python 3.12)</strong></summary>

```sh
npm run serve:backend-fastapi
# or: cd apps/backend-fastapi && uv run uvicorn app.main:app --host 0.0.0.0 --port 42411 --reload
```

See [`docs/backends/fastapi.md`](docs/backends/fastapi.md) and [`apps/backend-fastapi/`](apps/backend-fastapi/).

</details>

<details>
<summary><strong>.NET (C#)</strong></summary>

```sh
npm run serve:backend-dotnet
# or: cd apps/backend-dotnet && dotnet run
```

See [`docs/backends/dotnet.md`](docs/backends/dotnet.md) and [`apps/backend-dotnet/`](apps/backend-dotnet/).

</details>

<details>
<summary><strong>Gin (Go 1.23)</strong></summary>

```sh
npm run serve:backend-gin
# or: cd apps/backend-gin && go run ./cmd/server
```

See [`docs/backends/gin.md`](docs/backends/gin.md) and [`apps/backend-gin/`](apps/backend-gin/).

</details>

## Commands

```sh
npm run serve                  # Frontend only (point at whichever backend is running)
npm run serve:backend-nestjs   # Start NestJS backend
npm run serve:backend-spring   # Start Spring Boot backend
npm run serve:backend-fastapi  # Start FastAPI backend
npm run serve:backend-dotnet   # Start .NET backend
npm run serve:backend-gin      # Start Gin backend
npm run openapi:export         # Regenerate docs/openapi.yaml from the NestJS source of truth
npm run build                  # Build all Nx projects (frontend + backend-nestjs)
npm run lint                   # Lint all Nx projects
npm run test                   # Test all Nx projects
```

## API Endpoints

The canonical contract lives in [`docs/openapi.yaml`](docs/openapi.yaml). Summary:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/photos` | List all photos |
| `GET` | `/api/photos/:id` | Get photo by ID |
| `POST` | `/api/photos/upload` | Upload a new photo (multipart/form-data) |
| `POST` | `/api/photos/:id/thumbnail` | Generate thumbnail (query: width, height) |
| `DELETE` | `/api/photos/:id` | Delete a photo |

### Upload Constraints

- Max file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP

## Features

- **Photo Upload**: Drag-and-drop or click to upload images with optional tags
- **Photo Gallery**: Grid view of all uploaded photos
- **Thumbnail Generation**: On-demand thumbnail creation
- **Tag Support**: Organize photos with comma-separated tags
- **SQLite Persistence**: Photos stored in local database
- **WCAG 2.1 Accessible**: Keyboard navigation and screen reader support

## AI-Assisted Development

This project includes configuration for multiple AI coding assistants to support team-augmented development workflows.

### Available Agents

| Agent | Purpose |
|-------|---------|
| `@architecture-guardian` | Validates architectural decisions |
| `@api-contract-agent` | Ensures API backward compatibility |
| `@legacy-modernizer` | Guides safe refactoring |
| `@test-strategist` | Recommends test strategies |
| `@release-safety` | Validates release readiness |

### Available Commands

| Command | Purpose |
|---------|---------|
| `/trace-flow` | Trace system flow end-to-end |
| `/prepare-pr` | Generate PR description & checklist |
| `/add-tests` | Generate comprehensive tests |
| `/migration-plan` | Plan incremental refactoring |
| `/explain-oncall` | On-call incident guidance |
| `/code-reviewer` | AI-assisted code review |

### Available Skills

Reusable capabilities shared across AI platforms:

| Skill | Purpose |
|-------|---------|
| `topology-awareness` | Dependency mapping and impact analysis |
| `change-impact-analysis` | Risk assessment for code changes |
| `incremental-refactoring` | Safe, step-by-step refactoring plans |
| `framework-conventions` | Enforce team coding patterns |
| `debug-correlation` | Root cause analysis for production issues |

See [AGENTS.md](AGENTS.md) for cross-platform agent reference, [CLAUDE.md](CLAUDE.md) for Claude Code setup, and [GEMINI.md](GEMINI.md) for Gemini CLI setup.
