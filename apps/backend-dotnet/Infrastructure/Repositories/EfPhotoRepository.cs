using Microsoft.EntityFrameworkCore;
using PhotoGallery.Backend.Domain.Models;
using PhotoGallery.Backend.Domain.Repositories;
using PhotoGallery.Backend.Infrastructure.Data;
using PhotoGallery.Backend.Infrastructure.Entities;

namespace PhotoGallery.Backend.Infrastructure.Repositories;

/// <summary>
/// EF Core-backed adapter implementing <see cref="IPhotoRepository"/>.
/// Converts between <see cref="PhotoEntity"/> and the domain <see cref="Photo"/>.
/// </summary>
public class EfPhotoRepository : IPhotoRepository
{
    private readonly AppDbContext _dbContext;

    public EfPhotoRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Photo> CreateAsync(Photo photo, CancellationToken cancellationToken = default)
    {
        var entity = new PhotoEntity
        {
            Filename = photo.Filename,
            StoredFilename = photo.StoredFilename,
            Url = photo.Url,
            Size = photo.Size,
            Tags = photo.Tags ?? new List<string>(),
            CreatedAt = photo.CreatedAt == default ? DateTime.UtcNow : photo.CreatedAt,
        };
        _dbContext.Photos.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return EntityToDomain(entity);
    }

    public async Task<IReadOnlyList<Photo>> FindAllAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.Photos
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
        return rows.Select(EntityToDomain).ToList();
    }

    public async Task<Photo?> FindByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var row = await _dbContext.Photos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        return row is null ? null : EntityToDomain(row);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var row = await _dbContext.Photos.FindAsync(new object?[] { id }, cancellationToken);
        if (row is null)
        {
            return false;
        }
        _dbContext.Photos.Remove(row);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static Photo EntityToDomain(PhotoEntity e) => new()
    {
        Id = e.Id,
        Filename = e.Filename,
        StoredFilename = e.StoredFilename,
        Url = e.Url,
        Size = e.Size,
        Tags = e.Tags ?? new List<string>(),
        CreatedAt = DateTime.SpecifyKind(e.CreatedAt, DateTimeKind.Utc),
    };
}
