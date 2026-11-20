using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using PhotoGallery.Backend.Api.Photos;
using PhotoGallery.Backend.Api.Photos.Dto;
using PhotoGallery.Backend.Domain.Repositories;
using PhotoGallery.Backend.Domain.Services;
using PhotoGallery.Backend.Infrastructure.Data;
using PhotoGallery.Backend.Infrastructure.Repositories;
using PhotoGallery.Backend.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Port: read env DOTNET_BACKEND_PORT (default 42621). All four reference
// backends bind the same port so the frontend's proxy works unchanged.
// ---------------------------------------------------------------------------
var port = int.TryParse(Environment.GetEnvironmentVariable("DOTNET_BACKEND_PORT"), out var envPort)
    ? envPort
    : 42621;
builder.WebHost.ConfigureKestrel(options => options.ListenAnyIP(port));

// ---------------------------------------------------------------------------
// Filesystem paths — relative to ContentRootPath (the project dir in dev,
// the publish dir in prod). Create parent dirs up-front.
// ---------------------------------------------------------------------------
var contentRoot = builder.Environment.ContentRootPath;
var dbRelative = builder.Configuration["PhotoGallery:DatabasePath"] ?? "data/photogallery.db";
var uploadsRelative = builder.Configuration["PhotoGallery:UploadsPath"] ?? "uploads";
var maxFileSizeBytes = builder.Configuration.GetValue<long?>("PhotoGallery:MaxFileSizeBytes") ?? 5L * 1024 * 1024;

var dbPath = Path.GetFullPath(Path.Combine(contentRoot, dbRelative));
var uploadsDir = Path.GetFullPath(Path.Combine(contentRoot, uploadsRelative));
Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
Directory.CreateDirectory(uploadsDir);

// ---------------------------------------------------------------------------
// EF Core / SQLite
// ---------------------------------------------------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// ---------------------------------------------------------------------------
// Domain / infrastructure DI
// ---------------------------------------------------------------------------
builder.Services.AddScoped<IPhotoRepository, EfPhotoRepository>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddSingleton<IDiskStorage>(new DiskStorage(uploadsDir));

// ---------------------------------------------------------------------------
// Multipart upload limits — 5 MB matches the NestJS MaxFileSizeValidator.
// Controller also enforces the per-file cap so requests never buffer past it.
// ---------------------------------------------------------------------------
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxFileSizeBytes;
    options.ValueLengthLimit = int.MaxValue;
});
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = maxFileSizeBytes;
});

// ---------------------------------------------------------------------------
// Controllers + JSON (ASP.NET Core defaults to camelCase; make it explicit).
// ---------------------------------------------------------------------------
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

// Reshape the [ApiController] auto-400s into the shared error envelope so the
// frontend gets one consistent error format regardless of failure mode.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? "Invalid request" : e.ErrorMessage)
            .ToArray();
        var envelope = new ErrorEnvelope(
            StatusCodes.Status400BadRequest,
            errors.Length == 0 ? "Invalid request" : string.Join("; ", errors),
            "Bad Request");
        return new BadRequestObjectResult(envelope);
    };
});

// ---------------------------------------------------------------------------
// Swagger UI
// ---------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Photo Gallery API",
        Version = "1.0.0",
        Description = "Canonical HTTP contract for the photo-gallery backend — .NET implementation. "
            + "Interchangeable with the NestJS, Spring Boot, FastAPI and Gin backends.",
    });
});

// ---------------------------------------------------------------------------
// Exception handler → shared envelope
// ---------------------------------------------------------------------------
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

// ---------------------------------------------------------------------------
// Auto-migrate DB on startup. Matches Gin's auto-migrate / NestJS synchronize.
// ---------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Exception handler must be registered early in the pipeline so it catches
// exceptions from subsequent middleware (static files, controllers, etc.).
app.UseExceptionHandler(_ => { });

// ---------------------------------------------------------------------------
// Static uploads — frontend expects GET /uploads/{storedFilename}.
// ---------------------------------------------------------------------------
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads",
});

// ---------------------------------------------------------------------------
// Swagger UI at /api/docs
// ---------------------------------------------------------------------------
app.UseSwagger(c => c.RouteTemplate = "api/{documentName}/swagger.json");
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/api/v1/swagger.json", "Photo Gallery API v1");
    c.RoutePrefix = "api/docs";
});

app.MapControllers();

// Liveness probe — handy for container orchestration; matches the Gin backend.
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

Console.WriteLine($"Photo Gallery (.NET) listening on http://localhost:{port}/api");
Console.WriteLine($"Swagger UI:                       http://localhost:{port}/api/docs");

app.Run();

// Exposed so integration tests can use WebApplicationFactory<Program>.
public partial class Program { }
