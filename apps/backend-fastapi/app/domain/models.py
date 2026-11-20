"""Domain models — Pydantic response schemas exposed by the API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(snake: str) -> str:
    """Convert ``snake_case`` field name to ``camelCase`` alias."""
    head, *tail = snake.split("_")
    return head + "".join(part.capitalize() for part in tail)


class Photo(BaseModel):
    """Photo response payload.

    Python attributes are ``snake_case``. JSON keys are ``camelCase`` so the
    wire format matches the NestJS reference implementation exactly.
    """

    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: str = Field(..., examples=["1"], description="Photo identifier (string)")
    filename: str = Field(..., examples=["holiday.jpg"], description="Original filename")
    stored_filename: str = Field(
        ...,
        examples=["1700000000000-123456789.jpg"],
        description="Unique filename on disk",
    )
    url: str = Field(
        ...,
        examples=["/uploads/1700000000000-123456789.jpg"],
        description="URL to serve the file",
    )
    size: int = Field(..., examples=[245678], description="File size in bytes")
    tags: list[str] = Field(
        default_factory=list,
        examples=[["vacation", "beach"]],
        description="Tags associated with the photo",
    )
    created_at: datetime = Field(..., description="Creation timestamp (ISO 8601 UTC)")


class DeleteResult(BaseModel):
    """Result of a delete operation."""

    success: bool


class ErrorResponse(BaseModel):
    """NestJS-compatible error envelope."""

    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    status_code: int
    message: str
    error: str
