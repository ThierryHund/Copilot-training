using System.Text.Json;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace PhotoGallery.Backend.Infrastructure.Converters;

/// <summary>
/// EF Core value converter that round-trips a <see cref="List{String}"/> to / from
/// a JSON TEXT column. This mirrors:
/// <list type="bullet">
///   <item>NestJS/TypeORM <c>simple-json</c> column type</item>
///   <item>Spring Boot Hibernate <c>AttributeConverter&lt;List&lt;String&gt;, String&gt;</c></item>
///   <item>FastAPI/SQLModel JSON text column</item>
///   <item>Gin/GORM <c>datatypes.JSON</c> / <c>StringSlice</c></item>
/// </list>
/// so the four backends share identical tag storage semantics.
/// </summary>
public class StringListJsonConverter : ValueConverter<List<string>, string>
{
    public StringListJsonConverter()
        : base(
            v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(string.IsNullOrEmpty(v) ? "[]" : v, (JsonSerializerOptions?)null) ?? new List<string>())
    {
    }
}
