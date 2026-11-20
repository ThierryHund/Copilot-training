"""SQLite engine, session factory, and schema bootstrap."""

from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

# Persist DB under ./db/photos.sqlite next to the uploads folder.
_DB_DIR = Path(os.getenv("FASTAPI_DB_DIR", "db")).resolve()
_DB_DIR.mkdir(parents=True, exist_ok=True)
_DB_PATH = _DB_DIR / "photos.sqlite"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_DB_PATH}")

# ``check_same_thread=False`` is required for SQLite under Uvicorn's worker model.
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)


def init_db() -> None:
    """Create tables if they do not yet exist."""
    # Ensure entity modules are imported so SQLModel.metadata knows about them.
    from app.infrastructure import entities  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """FastAPI dependency — yields a short-lived DB session."""
    with Session(engine) as session:
        yield session
