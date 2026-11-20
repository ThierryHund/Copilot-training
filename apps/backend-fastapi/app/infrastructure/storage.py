"""Disk storage helper for uploaded photos."""

from __future__ import annotations

import os
import random
import time
from pathlib import Path

UPLOADS_DIR = Path(os.getenv("FASTAPI_UPLOADS_DIR", "uploads")).resolve()


def ensure_uploads_dir() -> Path:
    """Create the uploads directory if missing and return its path."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOADS_DIR


def generate_stored_filename(original_filename: str) -> str:
    """Return a unique on-disk filename preserving the original extension.

    Format mirrors the NestJS multer config: ``{epoch_ms}-{rand}{ext}``.
    """
    ext = ""
    if original_filename and "." in original_filename:
        ext = "." + original_filename.rsplit(".", 1)[-1].lower()
    epoch_ms = int(time.time() * 1000)
    rand = random.randint(0, 1_000_000_000)
    return f"{epoch_ms}-{rand}{ext}"


def save_bytes(stored_filename: str, data: bytes) -> Path:
    """Write ``data`` to ``uploads/<stored_filename>`` and return its path."""
    target_dir = ensure_uploads_dir()
    target = target_dir / stored_filename
    with open(target, "wb") as f:
        f.write(data)
    return target


def delete_file(stored_filename: str) -> bool:
    """Remove a stored file; return True if removed, False if missing."""
    target = UPLOADS_DIR / stored_filename
    try:
        target.unlink()
        return True
    except FileNotFoundError:
        return False
