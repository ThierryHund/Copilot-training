using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PhotoGallery.Backend.Infrastructure.Entities;

/// <summary>
/// EF Core persistence entity. Column names are snake-case-ish to align with the
/// NestJS/TypeORM schema so the four backends can, in principle, open the same
/// SQLite file. The tags column is JSON TEXT via <see cref="Converters.StringListJsonConverter"/>.
/// </summary>
[Table("photos")]
public class PhotoEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("filename")]
    public string Filename { get; set; } = string.Empty;

    [Required]
    [Column("stored_filename")]
    public string StoredFilename { get; set; } = string.Empty;

    [Required]
    [Column("url")]
    public string Url { get; set; } = string.Empty;

    [Column("size")]
    public long Size { get; set; }

    /// <summary>
    /// Persisted as JSON TEXT via <see cref="Converters.StringListJsonConverter"/>,
    /// matching NestJS <c>simple-json</c>, Hibernate AttributeConverter, SQLModel
    /// JSON text, and GORM <c>datatypes.JSON</c>.
    /// </summary>
    [Column("tags")]
    public List<string> Tags { get; set; } = new();

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
