"""Photo domain service — business logic, storage and persistence."""

from __future__ import annotations

from sqlmodel import Session, select

from app.domain.models import Photo
from app.infrastructure import storage
from app.infrastructure.entities import PhotoEntity


class PhotoNotFoundError(Exception):
    """Raised when a photo lookup fails in a place that requires its existence."""

    def __init__(self, photo_id: str) -> None:
        super().__init__(f"Photo not found: {photo_id}")
        self.photo_id = photo_id


class PhotoService:
    """Encapsulates photo-related use cases.

    The service owns the conversion between :class:`PhotoEntity` (DB row) and
    :class:`Photo` (API response model) so the api layer stays thin.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    # -- use cases ----------------------------------------------------------

    def upload_photo(
        self,
        *,
        original_filename: str,
        data: bytes,
        tags: list[str] | None = None,
    ) -> Photo:
        """Persist a new photo to disk and to the database."""
        stored_filename = storage.generate_stored_filename(original_filename)
        storage.save_bytes(stored_filename, data)

        entity = PhotoEntity(
            filename=original_filename,
            stored_filename=stored_filename,
            url=f"/uploads/{stored_filename}",
            size=len(data),
        )
        entity.set_tags(tags or [])

        self._session.add(entity)
        self._session.commit()
        self._session.refresh(entity)
        return self._to_photo(entity)

    def get_photos(self) -> list[Photo]:
        """Return every photo, newest first."""
        statement = select(PhotoEntity).order_by(PhotoEntity.created_at.desc())
        entities = self._session.exec(statement).all()
        return [self._to_photo(e) for e in entities]

    def get_photo_by_id(self, photo_id: str) -> Photo | None:
        """Return a photo by ID, or ``None`` if it does not exist."""
        entity = self._find(photo_id)
        return self._to_photo(entity) if entity else None

    def generate_thumbnail(
        self,
        photo_id: str,
        width: int = 150,
        height: int = 150,
    ) -> str:
        """Return a thumbnail URL string for the photo.

        Mirrors the NestJS stub: no real image processing; raises if the
        photo does not exist.
        """
        photo = self.get_photo_by_id(photo_id)
        if photo is None:
            raise PhotoNotFoundError(photo_id)
        return f"{photo.url}?w={width}&h={height}"

    def delete_photo(self, photo_id: str) -> bool:
        """Delete a photo row and its file. Returns False if not found."""
        entity = self._find(photo_id)
        if entity is None:
            return False
        stored_filename = entity.stored_filename
        self._session.delete(entity)
        self._session.commit()
        storage.delete_file(stored_filename)
        return True

    # -- helpers ------------------------------------------------------------

    def _find(self, photo_id: str) -> PhotoEntity | None:
        try:
            pk = int(photo_id)
        except (TypeError, ValueError):
            return None
        return self._session.get(PhotoEntity, pk)

    @staticmethod
    def _to_photo(entity: PhotoEntity) -> Photo:
        return Photo(
            id=str(entity.id),
            filename=entity.filename,
            stored_filename=entity.stored_filename,
            url=entity.url,
            size=entity.size,
            tags=entity.tags_list(),
            created_at=entity.created_at,
        )
