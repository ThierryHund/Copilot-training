"""HTTP router for ``/api/photos``."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from sqlmodel import Session

from app.api.errors import FileTooLargeError, UnsupportedMediaTypeError
from app.domain.models import DeleteResult, Photo
from app.domain.services import PhotoService
from app.infrastructure.database import get_session

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {"image/jpeg", "image/png", "image/gif", "image/webp"}
)

router = APIRouter(prefix="/photos", tags=["photos"])


def _service(session: Annotated[Session, Depends(get_session)]) -> PhotoService:
    return PhotoService(session)


ServiceDep = Annotated[PhotoService, Depends(_service)]


def _parse_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


@router.post(
    "/upload",
    response_model=Photo,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
    operation_id="uploadPhoto",
    summary="Upload a new photo",
)
async def upload_photo(
    service: ServiceDep,
    file: Annotated[UploadFile, File(description="Image file (JPEG/PNG/GIF/WebP), max 5MB")],
    tags: Annotated[str | None, Form(description="Comma-separated tag list")] = None,
) -> Photo:
    """Upload a photo and persist its metadata."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedMediaTypeError(
            "Unsupported file type. Allowed: image/jpeg, image/png, image/gif, image/webp"
        )

    # Read the upload; enforce the size limit early so we never persist oversize files.
    data = await file.read()
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError()

    return service.upload_photo(
        original_filename=file.filename or "upload",
        data=data,
        tags=_parse_tags(tags),
    )


@router.get(
    "",
    response_model=list[Photo],
    response_model_by_alias=True,
    operation_id="getPhotos",
    summary="List all photos",
)
async def get_photos(service: ServiceDep) -> list[Photo]:
    """Return all photos, newest first."""
    return service.get_photos()


@router.get(
    "/{photo_id}",
    response_model=Photo | None,
    response_model_by_alias=True,
    operation_id="getPhotoById",
    summary="Get a photo by ID",
)
async def get_photo_by_id(photo_id: str, service: ServiceDep) -> Photo | None:
    """Return a photo by id, or JSON ``null`` if not found (matches NestJS)."""
    return service.get_photo_by_id(photo_id)


@router.post(
    "/{photo_id}/thumbnail",
    status_code=status.HTTP_201_CREATED,
    operation_id="generateThumbnail",
    summary="Generate a thumbnail URL for a photo",
    responses={
        201: {
            "description": "Thumbnail URL",
            "content": {
                "application/json": {
                    "schema": {"type": "string"},
                    "example": "/uploads/1700000000000-123.jpg?w=150&h=150",
                }
            },
        }
    },
)
async def generate_thumbnail(
    photo_id: str,
    service: ServiceDep,
    width: Annotated[int, Query(ge=1)] = 150,
    height: Annotated[int, Query(ge=1)] = 150,
) -> Response:
    """Return the thumbnail URL as a plain JSON string (no wrapper object)."""
    url = service.generate_thumbnail(photo_id, width, height)
    # FastAPI would wrap a ``str`` return inside a JSON response with the usual
    # content type anyway, but we use ``Response`` to guarantee we emit a bare
    # JSON string (matching the NestJS shape exactly).
    import json as _json

    return Response(
        content=_json.dumps(url),
        media_type="application/json",
        status_code=status.HTTP_201_CREATED,
    )


@router.delete(
    "/{photo_id}",
    response_model=DeleteResult,
    operation_id="deletePhoto",
    summary="Delete a photo",
)
async def delete_photo(photo_id: str, service: ServiceDep) -> DeleteResult:
    """Delete a photo. Returns ``{success: false}`` when not found."""
    return DeleteResult(success=service.delete_photo(photo_id))
