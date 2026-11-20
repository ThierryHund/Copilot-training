namespace PhotoGallery.Backend.Api.Photos.Dto;

/// <summary>
/// Body returned by <c>DELETE /api/photos/{id}</c>:
/// <c>{ "success": true | false }</c>. False when the id did not exist — no 404.
/// </summary>
public record DeleteResponse(bool Success);
