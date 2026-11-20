namespace PhotoGallery.Backend.Domain.Models;

/// <summary>
/// Domain model representing a photo. Persistence-agnostic — the infrastructure layer
/// maps between this type and the EF Core entity (<c>PhotoEntity</c>).
/// Mirrors the NestJS, Spring, FastAPI, and Gin reference domain models so the
/// four backends share identical business contracts.
/// </summary>
public class Photo
{
    public int Id { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string StoredFilename { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long Size { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Represents a file received by the API layer that the domain service can persist.
/// Mirrors the NestJS <c>Express.Multer.File</c> shape.
/// </summary>
public record UploadedFile(string OriginalName, string StoredFilename, long Size);
