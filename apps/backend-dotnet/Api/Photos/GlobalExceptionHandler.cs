using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using PhotoGallery.Backend.Api.Photos.Dto;

namespace PhotoGallery.Backend.Api.Photos;

/// <summary>
/// .NET 8 <see cref="IExceptionHandler"/> that maps any unhandled exception into
/// the shared error envelope used by every backend:
/// <code>
/// { "statusCode": 400, "message": "...", "error": "Bad Request" }
/// </code>
/// Registration: <c>builder.Services.AddExceptionHandler&lt;GlobalExceptionHandler&gt;()</c>
/// + <c>app.UseExceptionHandler(_ =&gt; {})</c>.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, errorLabel) = MapException(exception);

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception at {Path}", httpContext.Request.Path);
        }
        else
        {
            _logger.LogWarning(exception, "Client error at {Path}: {Message}", httpContext.Request.Path, exception.Message);
        }

        httpContext.Response.Clear();
        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json; charset=utf-8";

        var envelope = new ErrorEnvelope(statusCode, exception.Message, errorLabel);
        await JsonSerializer.SerializeAsync(
            httpContext.Response.Body,
            envelope,
            JsonOptions,
            cancellationToken);

        return true;
    }

    private static (int statusCode, string errorLabel) MapException(Exception exception) => exception switch
    {
        BadHttpRequestException bad => (
            bad.StatusCode >= 400 && bad.StatusCode < 600 ? bad.StatusCode : StatusCodes.Status400BadRequest,
            "Bad Request"),
        ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
        _ => (StatusCodes.Status500InternalServerError, "Internal Server Error"),
    };
}
