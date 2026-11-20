using Microsoft.AspNetCore.Http;

namespace PhotoGallery.Backend.Infrastructure.Storage;

/// <summary>
/// Writes uploaded files to a local directory using unique
/// <c>{unixMilliseconds}-{randomInt}.{ext}</c> filenames, matching the
/// NestJS <c>multer.diskStorage</c> / Gin <c>DiskStorage</c> behavior.
/// </summary>
public class DiskStorage : IDiskStorage
{
    private readonly string _directory;
    private static readonly Random _random = new();
    private static readonly object _randomLock = new();

    public DiskStorage(string directory)
    {
        _directory = string.IsNullOrWhiteSpace(directory) ? "uploads" : directory;
        Directory.CreateDirectory(_directory);
    }

    public async Task<string> SaveAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file is null)
        {
            throw new ArgumentNullException(nameof(file));
        }

        var storedFilename = BuildUniqueName(file.FileName);
        var destinationPath = Path.Combine(_directory, storedFilename);

        Directory.CreateDirectory(_directory);

        await using var outStream = new FileStream(
            destinationPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None);
        await file.CopyToAsync(outStream, cancellationToken);

        return storedFilename;
    }

    private static string BuildUniqueName(string originalName)
    {
        var ext = Path.GetExtension(originalName ?? string.Empty).ToLowerInvariant();
        var unixMilliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        int suffix;
        lock (_randomLock)
        {
            suffix = _random.Next(0, 1_000_000_000);
        }
        return $"{unixMilliseconds}-{suffix}{ext}";
    }
}
