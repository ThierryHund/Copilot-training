using PhotoGallery.Backend.Domain.Models;

namespace PhotoGallery.Backend.Domain.Repositories;

/// <summary>
/// Port describing persistence operations the service depends on.
/// Infrastructure provides the EF Core-backed adapter — swapping storage
/// only requires a new adapter, the domain layer is unaffected.
/// </summary>
public interface IPhotoRepository
{
    Task<Photo> CreateAsync(Photo photo, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns every photo ordered by <c>CreatedAt DESC</c>, matching NestJS.
    /// </summary>
    Task<IReadOnlyList<Photo>> FindAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the photo with the given numeric id, or <c>null</c> if absent.
    /// </summary>
    Task<Photo?> FindByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes the row and reports whether anything was removed.
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
