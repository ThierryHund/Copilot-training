using Microsoft.AspNetCore.Http;

namespace PhotoGallery.Backend.Api.Photos.Dto;

/// <summary>
/// multipart/form-data body of <c>POST /api/photos/upload</c>.
/// Matches the NestJS <c>UploadPhotoDto</c> and the OpenAPI contract.
/// </summary>
public class UploadPhotoDto
{
    /// <summary>
    /// Image file (JPEG, PNG, GIF, or WebP; max 5 MB).
    /// </summary>
    public IFormFile? File { get; set; }

    /// <summary>
    /// Comma-separated list of tags, e.g. <c>vacation,beach,sunset</c>.
    /// </summary>
    public string? Tags { get; set; }
}
