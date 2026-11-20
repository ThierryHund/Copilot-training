using Microsoft.AspNetCore.Http;

namespace PhotoGallery.Backend.Infrastructure.Storage;

/// <summary>
/// Port for saving uploaded files. Mirrors NestJS <c>multer.diskStorage</c>,
/// Spring's <c>StorageService</c>, FastAPI's disk writer and Gin's
/// <c>DiskStorage.Save</c>.
/// </summary>
public interface IDiskStorage
{
    /// <summary>
    /// Writes the uploaded file to disk under a unique name and returns that stored filename.
    /// </summary>
    Task<string> SaveAsync(IFormFile file, CancellationToken cancellationToken = default);
}
