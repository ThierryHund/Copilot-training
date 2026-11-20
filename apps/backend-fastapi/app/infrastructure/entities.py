"""SQLModel table definitions."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class PhotoEntity(SQLModel, table=True):
    """Photo row in the ``photos`` table.

    ``tags`` is stored as a JSON-encoded string in a TEXT column (SQLite has
    no native array type). Use :meth:`tags_list` / :meth:`set_tags` to
    round-trip as a Python list.
    """

    __tablename__ = "photos"

    id: int | None = Field(default=None, primary_key=True)
    filename: str = Field(nullable=False)
    stored_filename: str = Field(
        sa_column=Column("stored_filename", String, unique=True, nullable=False),
    )
    url: str = Field(nullable=False)
    size: int = Field(nullable=False)
    tags_json: str = Field(
        default="[]",
        sa_column=Column("tags", Text, nullable=False, default="[]"),
    )
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)

    # --- tag helpers -------------------------------------------------------

    def tags_list(self) -> list[str]:
        """Return tags as a Python list."""
        try:
            value = json.loads(self.tags_json or "[]")
        except (TypeError, ValueError):
            return []
        return [str(t) for t in value] if isinstance(value, list) else []

    def set_tags(self, tags: list[str]) -> None:
        """Set tags from a Python list."""
        self.tags_json = json.dumps(list(tags))
