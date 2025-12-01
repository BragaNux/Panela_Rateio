using System.Text;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Panela.Api.Data;
using Panela.Api.Services;
using QuestPDF;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var conn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrWhiteSpace(dbUrl))
{
    try
    {
        var uri = new Uri(dbUrl);
        var userInfo = uri.UserInfo.Split(':');
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var parts = new List<string>
        {
            $"Host={host}",
            $"Port={port}",
            $"Database={database}",
            $"Username={username}",
            $"Password={password}"
        };
        var query = uri.Query.TrimStart('?');
        if (!string.IsNullOrWhiteSpace(query))
        {
            foreach (var kv in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var eq = kv.IndexOf('=');
                if (eq <= 0) continue;
                var qkey = Uri.UnescapeDataString(kv.Substring(0, eq)).Trim();
                var qval = Uri.UnescapeDataString(kv.Substring(eq + 1)).Trim();
                if (qkey.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
                    parts.Add($"Ssl Mode={qval}");
                else if (qkey.Equals("trust_server_certificate", StringComparison.OrdinalIgnoreCase) || qkey.Equals("trust-server-certificate", StringComparison.OrdinalIgnoreCase))
                    parts.Add($"Trust Server Certificate={qval}");
            }
        }
        conn = string.Join(';', parts);
    }
    catch {}
}
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseNpgsql(conn, npg => npg.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null));
});
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<GroupService>();
builder.Services.AddScoped<ExpenseService>();
builder.Services.AddScoped<RateioService>();
builder.Services.AddScoped<FriendService>();
builder.Services.AddScoped<CalculationService>();
builder.Services.AddScoped<PdfService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<AiService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
var corsOrigin = Environment.GetEnvironmentVariable("CORS_ORIGIN");
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCors", policy =>
    {
        if (!string.IsNullOrWhiteSpace(corsOrigin))
            policy.WithOrigins(corsOrigin).AllowAnyMethod().AllowAnyHeader();
        else
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "PANELA API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando Bearer. Ex: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "dev_secret_change_me";
if (builder.Environment.IsProduction() && jwtKey == "dev_secret_change_me")
    throw new Exception("JWT_SECRET não definido em produção");
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key
        };
    });

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var redacted = string.Join(';', conn.Split(';').Where(s => !s.StartsWith("Password=")));
        app.Logger.LogInformation("Conexao DB: {conn}", redacted);
        db.Database.Migrate();
        var needsInit = false;
        try { db.Database.ExecuteSqlRaw("SELECT 1 FROM \"Users\" LIMIT 1;"); }
        catch { needsInit = true; }
        if (needsInit)
        {
            try { db.Database.ExecuteSqlRaw("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"); } catch {}
            try { db.Database.ExecuteSqlRaw("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"); } catch {}
            var basePath = builder.Environment.ContentRootPath;
            var scripts = new[]
            {
                System.IO.Path.Combine(basePath, "init_db_fixed.sql"),
                System.IO.Path.Combine(basePath, "Migrations", "20241122_AdaptacaoProtótipoWeb.sql")
            };
            foreach (var scriptPath in scripts)
            {
                if (System.IO.File.Exists(scriptPath))
                {
                    var sql = System.IO.File.ReadAllText(scriptPath);
                    foreach (var part in sql.Split(';'))
                    {
                        var stmt = part.Trim();
                        if (string.IsNullOrEmpty(stmt)) continue;
                        if (stmt.StartsWith("--")) continue;
                        try { db.Database.ExecuteSqlRaw(stmt); } catch {}
                    }
                }
            }
        }
        // Ensure PasswordResets table exists even if DB was previously initialized
        try
        {
            var createPasswordResets = @"
CREATE TABLE IF NOT EXISTS ""PasswordResets"" (
    ""Id"" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ""UserId"" UUID NOT NULL,
    ""CodeHash"" VARCHAR(255) NOT NULL,
    ""ExpiresAt"" TIMESTAMP WITH TIME ZONE NOT NULL,
    ""Used"" BOOLEAN NOT NULL DEFAULT FALSE,
    ""CreatedAt"" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ""FK_PasswordResets_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users""(""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_PasswordResets_User_Used"" ON ""PasswordResets"" (""UserId"", ""Used"");
";
            db.Database.ExecuteSqlRaw(createPasswordResets);
        }
        catch {}
        try
        {
            using var cmd = db.Database.GetDbConnection().CreateCommand();
            db.Database.OpenConnection();
            var checks = new List<(string table, string[] cols)>
            {
                ("Users", new[]{"Id","Email","PasswordHash","Nome","ChavePix","CreatedAt"}),
                ("Groups", new[]{"Id","Nome","Descricao","CreatorId","CreatedAt","Finalizado","FinalizadoEm"}),
                ("Members", new[]{"Id","GroupId","UserId","Status","JoinedAt"}),
                ("Expenses", new[]{"Id","GroupId","PayerId","PagadorNome","Descricao","Amount","Date","CreatedAt"}),
                ("Splits", new[]{"Id","ExpenseId","MemberId","Mode","ShareValue","CreatedAt"}),
                ("FriendRequests", new[]{"Id","RemetenteId","DestinatarioId","Status","CreatedAt","UpdatedAt"}),
                ("Friendships", new[]{"UserId1","UserId2","CreatedAt"}),
                ("Notifications", new[]{"Id","UserId","Type","Message","IsRead","CreatedAt"})
            };
            foreach (var (table, cols) in checks)
            {
                cmd.CommandText = "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=@t";
                var p = cmd.CreateParameter();
                p.ParameterName = "@t";
                p.Value = table;
                cmd.Parameters.Clear();
                cmd.Parameters.Add(p);
                var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) found.Add(reader.GetString(0));
                var missing = cols.Where(c => !found.Contains(c)).ToArray();
                if (missing.Length == 0) app.Logger.LogInformation("Tabela {table} OK", table);
                else app.Logger.LogWarning("Tabela {table} faltando colunas: {cols}", table, string.Join(',', missing));
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Falha na verificação de schema");
        }
    }
    catch (Exception ex)
    {
        var sanitized = string.Join(';', conn.Split(';').Where(s => !s.StartsWith("Password=")));
        app.Logger.LogError(ex, "Erro ao aplicar migrations. Conn= {conn}", sanitized);
        try { db.Database.ExecuteSqlRaw("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"); } catch {}
        try { db.Database.ExecuteSqlRaw("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"); } catch {}
        var basePath = builder.Environment.ContentRootPath;
        var scripts = new[]
        {
            System.IO.Path.Combine(basePath, "init_db_fixed.sql"),
            System.IO.Path.Combine(basePath, "Migrations", "20241122_AdaptacaoProtótipoWeb.sql")
        };
        foreach (var scriptPath in scripts)
        {
            if (System.IO.File.Exists(scriptPath))
            {
                var sql = System.IO.File.ReadAllText(scriptPath);
                foreach (var part in sql.Split(';'))
                {
                    var stmt = part.Trim();
                    if (string.IsNullOrEmpty(stmt)) continue;
                    if (stmt.StartsWith("--")) continue;
                    try { db.Database.ExecuteSqlRaw(stmt); } catch {}
                }
            }
        }
    }
}
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PANELA API v1");
        c.RoutePrefix = "swagger";
    });
}
app.UseHttpsRedirection();
if (app.Environment.IsProduction()) app.UseHsts();
try
{
    var wwwroot = System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", "avatars");
    System.IO.Directory.CreateDirectory(wwwroot);
}
catch {}
app.UseStaticFiles();
app.UseCors("DefaultCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health/db", async (AppDbContext db) =>
{
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        return Results.Ok(new { Status = "Healthy", Db = "ok", Timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Json(new { Status = "Unhealthy", Error = ex.Message, Timestamp = DateTime.UtcNow }, statusCode: 500);
    }
});
app.MapGet("/api/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow, Service = "Panela API" });
app.Run();
