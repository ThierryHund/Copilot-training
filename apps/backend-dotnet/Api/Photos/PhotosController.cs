using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PhotoGallery.Backend.Api.Photos.Dto;
using PhotoGallery.Backend.Domain.Models;
using PhotoGallery.Backend.Domain.Services;
using PhotoGallery.Backend.Infrastructure.Storage;

namespace PhotoGallery.Backend.Api.Photos;

/// <summary>
/// Photos HTTP API. Mirrors the NestJS <c>PhotosController</c>, so the frontend
/// works unchanged against this backend.
/// </summary>
[ApiController]
[Route("api/photos")]
[Produces("application/json")]
public class PhotosController : ControllerBase
{
    private const long MaxUploadBytes = 5L * 1024 * 1024;
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg", // non-standard but commonly sent by browsers
        "image/png",
        "image/gif",
        "image/webp",
    };

    private readonly IPhotoService _photoService;
    private readonly IDiskStorage _storage;

    public PhotosController(IPhotoService photoService, IDiskStorage storage)
    {
        _photoService = photoService;
        _storage = storage;
    }

    /// <summary>
    /// Upload a new photo.
    /// </summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxUploadBytes)]
    [ProducesResponseType(typeof(PhotoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorEnvelope), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PhotoResponse>> UploadPhoto(
        [FromForm] UploadPhotoDto dto,
        CancellationToken cancellationToken)
    {
        var file = dto.File;
        if (file is null || file.Length == 0)
        {
            throw new BadHttpRequestException("File is required", StatusCodes.Status400BadRequest);
        }

        if (file.Length > MaxUploadBytes)
        {
            throw new BadHttpRequestException("File size exceeds 5MB limit", StatusCodes.Status400BadRequest);
        }

        var contentType = (file.ContentType ?? string.Empty).Trim().ToLowerInvariant();
        if (!AllowedMimeTypes.Contains(contentType))
        {
            throw new BadHttpRequestException(
                "Unsupported file type; expected image/jpeg|png|gif|webp",
                StatusCodes.Status400BadRequest);
        }

        var storedFilename = await _storage.SaveAsync(file, cancellationToken);

        var tags = ParseTags(dto.Tags);
        var uploaded = new UploadedFile(file.FileName, storedFilename, file.Length);
        var photo = await _photoService.UploadPhotoAsync(uploaded, tags, cancellationToken);

        var response = ToResponse(photo);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// List all photos ordered by <c>createdAt</c> descending.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PhotoResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PhotoResponse>>> GetPhotos(CancellationToken cancellationToken)
    {
        var photos = await _photoService.GetPhotosAsync(cancellationToken);
        return Ok(photos.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Get a single photo by id. Returns JSON <c>null</c> (200) when not found —
    /// matches NestJS/Spring/FastAPI/Gin; load-bearing for the frontend.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PhotoResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PhotoResponse?>> GetPhotoById(string id, CancellationToken cancellationToken)
    {
        var photo = await _photoService.GetPhotoByIdAsync(id, cancellationToken);
        if (photo is null)
        {
            // Produce a literal JSON `null` body with 200 OK, not a 404.
            return new JsonResult(null) { StatusCode = StatusCodes.Status200OK };
        }
        return Ok(ToResponse(photo));
    }

    /// <summary>
    /// Generate a thumbnail URL. Returns a plain JSON string body (no wrapper).
    /// Throws when the photo is missing so the exception handler produces a 500 —
    /// matches NestJS behavior.
    /// </summary>
    [HttpPost("{id}/thumbnail")]
    [ProducesResponseType(typeof(string), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorEnvelope), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<string>> GenerateThumbnail(
        string id,
        [FromQuery] int? width,
        [FromQuery] int? height,
        CancellationToken cancellationToken)
    {
        var w = width is > 0 ? width.Value : 150;
        var h = height is > 0 ? height.Value : 150;
        var url = await _photoService.GenerateThumbnailAsync(id, w, h, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, url);
    }

    /// <summary>
    /// Delete a photo. Returns <c>{ "success": bool }</c>. False (200) when the id
    /// did not exist — no 404, matching the other backends.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(DeleteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DeleteResponse>> DeletePhoto(string id, CancellationToken cancellationToken)
    {
        var deleted = await _photoService.DeletePhotoAsync(id, cancellationToken);
        return Ok(new DeleteResponse(deleted));
    }

    private static List<string> ParseTags(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new List<string>();
        }
        return raw.Split(',')
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            .ToList();
    }

    private static PhotoResponse ToResponse(Photo photo) => new(
        photo.Id.ToString(),
        photo.Filename,
        photo.StoredFilename,
        photo.Url,
        photo.Size,
        photo.Tags ?? new List<string>(),
        DateTime.SpecifyKind(photo.CreatedAt, DateTimeKind.Utc));
}
