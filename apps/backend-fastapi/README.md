# backend-fastapi

FastAPI implementation of the Photo Gallery backend HTTP contract.

It is one of four interchangeable backends (NestJS, Spring Boot, FastAPI, Gin)
that conform to the same HTTP contract documented in
[`../../docs/openapi.yaml`](../../docs/openapi.yaml). The Angular frontend at
`apps/frontend/` proxies `/api/*` and `/uploads/*` to port **42621** and is
agnostic to which backend implementation runs.

## Prerequisites

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) (recommended) or `pip`

## Install

Using uv:

```bash
uv sync
```

Using pip (inside a virtualenv):

```bash
pip install -e .
```

## Run

From this directory:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 42621 --reload
```

Or from the workspace root (Nx script):

```bash
npm run serve:backend-fastapi
```

### Configuration

| Variable                 | Default | Description                     |
| ------------------------ | ------- | ------------------------------- |
| `FASTAPI_BACKEND_PORT`   | `42621` | Port the ASGI server listens on |

An `.env` file is auto-loaded (see `.env.example`).

## API docs

FastAPI's auto-generated docs:

- Swagger UI: <http://localhost:42621/api/docs>
- ReDoc: <http://localhost:42621/api/redoc>
- OpenAPI JSON: <http://localhost:42621/api/openapi.json>

The canonical HTTP contract all backends must honor is at
[`../../docs/openapi.yaml`](../../docs/openapi.yaml).

## Architecture

Hexagonal layering, mirroring the NestJS reference:

```
app/
├── main.py                FastAPI app factory, router wiring, static /uploads mount
├── api/                   HTTP adapters — FastAPI routers, exception handlers
│   ├── photos.py
│   └── errors.py
├── domain/                Pure business logic — no framework imports
│   ├── models.py          Pydantic response model (Photo)
│   └── services.py        PhotoService
└── infrastructure/        Framework/IO adapters
    ├── entities.py        SQLModel Photo table
    ├── database.py        Engine, session factory, init_db
    └── storage.py         Disk storage helper
```

Data flows: **api → domain → infrastructure**. The domain layer never imports
from `api/`; it depends on SQLModel entities and plain Python only.
