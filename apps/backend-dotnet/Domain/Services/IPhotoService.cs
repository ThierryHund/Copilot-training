using PhotoGallery.Backend.Domain.Models;

namespace PhotoGallery.Backend.Domain.Services;

/// <summary>
/// Photo business logic surface. Matches the shape of the NestJS / Spring /
/// FastAPI / Gin reference services so cross-backend behavior is identical.
/// </summary>
public interface IPhotoService
{
    Task<Photo> UploadPhotoAsync(UploadedFile file, IReadOnlyList<string> tags, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Photo>> GetPhotosAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the photo or <c>null</c> when not found — matches NestJS (no 404).
    /// </summary>
    Task<Photo?> GetPhotoByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Throws when the photo does not exist — the exception handler maps that
    /// to a 500, matching NestJS's raw <c>throw new Error()</c> semantics.
    /// </summary>
    Task<string> GenerateThumbnailAsync(string id, int width, int height, CancellationToken cancellationToken = default);

    Task<bool> DeletePhotoAsync(string id, CancellationToken cancellationToken = default);
}
