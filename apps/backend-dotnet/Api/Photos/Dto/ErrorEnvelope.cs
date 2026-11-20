namespace PhotoGallery.Backend.Api.Photos.Dto;

/// <summary>
/// Standard error response shape — mirrors NestJS's default <c>HttpException</c>
/// body and is produced verbatim by the Spring / FastAPI / Gin backends, so the
/// frontend sees one envelope regardless of which backend is selected.
/// <code>
/// { "statusCode": 400, "message": "File size exceeds 5MB limit", "error": "Bad Request" }
/// </code>
/// </summary>
public record ErrorEnvelope(int StatusCode, string Message, string Error);
