namespace PhotoGallery.Backend.Api.Photos.Dto;

/// <summary>
/// JSON response shape returned to the frontend. Must match the NestJS contract:
/// <list type="bullet">
///   <item><c>id</c> is a STRING, not a number</item>
///   <item>camelCase keys (e.g. <c>storedFilename</c>, <c>createdAt</c>)</item>
///   <item>ISO 8601 UTC timestamps</item>
/// </list>
/// ASP.NET Core serializes records with camelCase by default, so no explicit
/// naming attributes are needed.
/// </summary>
public record PhotoResponse(
    string Id,
    string Filename,
    string StoredFilename,
    string Url,
    long Size,
    List<string> Tags,
    DateTime CreatedAt);
