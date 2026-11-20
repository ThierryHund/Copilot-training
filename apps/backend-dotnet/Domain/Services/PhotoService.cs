using PhotoGallery.Backend.Domain.Models;
using PhotoGallery.Backend.Domain.Repositories;

namespace PhotoGallery.Backend.Domain.Services;

/// <summary>
/// Domain service handling photo business logic. Framework-agnostic — talks to
/// persistence only via <see cref="IPhotoRepository"/>.
/// </summary>
public class PhotoService : IPhotoService
{
    private readonly IPhotoRepository _repository;

    public PhotoService(IPhotoRepository repository)
    {
        _repository = repository;
    }

    public async Task<Photo> UploadPhotoAsync(UploadedFile file, IReadOnlyList<string> tags, CancellationToken cancellationToken = default)
    {
        var photo = new Photo
        {
            Filename = file.OriginalName,
            StoredFilename = file.StoredFilename,
            Url = $"/uploads/{file.StoredFilename}",
            Size = file.Size,
            Tags = tags?.ToList() ?? new List<string>(),
            CreatedAt = DateTime.UtcNow,
        };
        return await _repository.CreateAsync(photo, cancellationToken);
    }

    public Task<IReadOnlyList<Photo>> GetPhotosAsync(CancellationToken cancellationToken = default)
        => _repository.FindAllAsync(cancellationToken);

    public async Task<Photo?> GetPhotoByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        // Invalid ids are treated as "not found" to match NestJS's forgiving behavior.
        if (!int.TryParse(id, out var numericId))
        {
            return null;
        }
        return await _repository.FindByIdAsync(numericId, cancellationToken);
    }

    public async Task<string> GenerateThumbnailAsync(string id, int width, int height, CancellationToken cancellationToken = default)
    {
        if (width <= 0) width = 150;
        if (height <= 0) height = 150;

        var photo = await GetPhotoByIdAsync(id, cancellationToken);
        if (photo is null)
        {
            // NestJS throws a raw Error here, which becomes a 500. Preserve that
            // behavior for contract parity across all four reference backends.
            throw new InvalidOperationException($"Photo not found: {id}");
        }
        return $"/uploads/{photo.StoredFilename}?w={width}&h={height}";
    }

    public async Task<bool> DeletePhotoAsync(string id, CancellationToken cancellationToken = default)
    {
        if (!int.TryParse(id, out var numericId))
        {
            return false;
        }
        return await _repository.DeleteAsync(numericId, cancellationToken);
    }
}
