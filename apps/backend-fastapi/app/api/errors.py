"""Global exception handlers that emit NestJS-compatible error envelopes."""

from __future__ import annotations

from http import HTTPStatus

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class FileTooLargeError(Exception):
    """Raised when an uploaded file exceeds the configured size limit."""

    def __init__(self, message: str = "File size exceeds 5MB limit") -> None:
        super().__init__(message)
        self.message = message


class UnsupportedMediaTypeError(Exception):
    """Raised when an uploaded file's content type is not allowed."""

    def __init__(self, message: str = "Unsupported file type") -> None:
        super().__init__(message)
        self.message = message


def _reason_phrase(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "Error"


def _error_payload(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "message": message,
        "error": _reason_phrase(status_code),
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Wire all exception handlers on the FastAPI app."""

    @app.exception_handler(FileTooLargeError)
    async def _file_too_large(_: Request, exc: FileTooLargeError) -> JSONResponse:
        return JSONResponse(status_code=400, content=_error_payload(400, exc.message))

    @app.exception_handler(UnsupportedMediaTypeError)
    async def _unsupported_media(_: Request, exc: UnsupportedMediaTypeError) -> JSONResponse:
        return JSONResponse(status_code=400, content=_error_payload(400, exc.message))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Summarise pydantic errors into a single human-readable message.
        details = exc.errors()
        if details:
            first = details[0]
            loc = ".".join(str(p) for p in first.get("loc", ()) if p != "body")
            msg = first.get("msg", "Validation failed")
            message = f"{loc}: {msg}" if loc else msg
        else:
            message = "Validation failed"
        return JSONResponse(status_code=400, content=_error_payload(400, message))

    @app.exception_handler(StarletteHTTPException)
    async def _http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        message = (
            exc.detail
            if isinstance(exc.detail, str)
            else _reason_phrase(exc.status_code)
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.status_code, message),
            headers=getattr(exc, "headers", None),
        )

    # Explicit alias so ``raise HTTPException(...)`` also hits the handler.
    app.add_exception_handler(HTTPException, _http_exception)
