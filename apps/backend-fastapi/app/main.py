"""FastAPI application factory for the Photo Gallery backend."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.errors import register_exception_handlers
from app.api.photos import router as photos_router
from app.infrastructure.database import init_db
from app.infrastructure.storage import ensure_uploads_dir

# Load variables from .env when present (no-op in production containers).
load_dotenv()


@asynccontextmanager
async def _lifespan(_: FastAPI):
    """Initialise DB schema and uploads directory at startup."""
    ensure_uploads_dir()
    init_db()
    yield


def create_app() -> FastAPI:
    """Build and return the FastAPI application."""
    app = FastAPI(
        title="Photo Gallery API",
        description=(
            "Canonical HTTP API contract for the Photo Gallery backend. "
            "All alternative backend implementations (NestJS, Spring Boot, FastAPI, Gin) "
            "must conform to this contract."
        ),
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=_lifespan,
    )

    # Permissive CORS — the Angular dev server proxies same-origin in practice,
    # but this keeps the backend usable when hit directly from other tools.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    # API routers — mounted under /api to match the NestJS global prefix.
    app.include_router(photos_router, prefix="/api")

    # Static /uploads mount MUST come after API routers so route resolution
    # still prefers explicit endpoints over static paths.
    uploads_dir = ensure_uploads_dir()
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    return app


app = create_app()


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    port = int(os.getenv("FASTAPI_BACKEND_PORT", "42621"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
