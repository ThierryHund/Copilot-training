using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PhotoGallery.Backend.Infrastructure.Converters;
using PhotoGallery.Backend.Infrastructure.Entities;

namespace PhotoGallery.Backend.Infrastructure.Data;

/// <summary>
/// EF Core DbContext for the photo-gallery backend.
/// Uses SQLite with a JSON TEXT tag column, mirroring the tag storage in the
/// NestJS, Spring, FastAPI, and Gin reference backends.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<PhotoEntity> Photos => Set<PhotoEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var photo = modelBuilder.Entity<PhotoEntity>();
        photo.ToTable("photos");
        photo.HasKey(p => p.Id);
        photo.HasIndex(p => p.StoredFilename).IsUnique();
        photo.Property(p => p.Filename).IsRequired();
        photo.Property(p => p.StoredFilename).IsRequired();
        photo.Property(p => p.Url).IsRequired();
        photo.Property(p => p.Size).IsRequired();
        photo.Property(p => p.CreatedAt).IsRequired();

        // JSON TEXT tags column — see StringListJsonConverter for why.
        var tagsComparer = new ValueComparer<List<string>>(
            (c1, c2) => c1!.SequenceEqual(c2!),
            c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
            c => c.ToList()
        );
        photo.Property(p => p.Tags)
            .HasConversion<StringListJsonConverter>()
            .HasColumnType("TEXT")
            .HasDefaultValue(new List<string>())
            .IsRequired()
            .Metadata.SetValueComparer(tagsComparer);
    }
}
