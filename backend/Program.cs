using backend.Domain.Entities;
using backend.Features.Auth.Email;
using backend.Infrastructure.Database;
using backend.Infrastructure.Services;
using backend.Shared.Constants;
using Backend.Monitoring;
using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Prometheus;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Formatting.Compact;
using Stripe;
using System.Text.Json.Serialization;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("service", "backend")
    .Enrich.WithProperty("version", Environment.GetEnvironmentVariable("IMAGE_TAG") ?? "local")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Gives the web server 30 seconds to finish processes any active requests, helping Kubernetes manage shutdowns gracefully.
builder.Host.ConfigureHostOptions(options =>
{
    options.ShutdownTimeout = TimeSpan.FromSeconds(30);
});

builder.Host.UseSerilog();

builder.Services.AddCarter();

StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

builder.Services.AddTransient<MailpitEmailSender>();

builder.Services.AddCors(options =>
{
    // Read the environment variable from DevOps / Kubernetes
    var originsEnv = Environment.GetEnvironmentVariable("AllowedOrigins") ?? "";

    // Split it if it exists, otherwise fall back to your local development ports
    var allowedOrigins = originsEnv.Length > 0
        ? originsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : ["http://localhost:5173", "http://localhost:3000"];

    // Attach the exact same policy name your app is looking for
    options.AddPolicy("AllowReactSPA", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter()
    );
});

builder.Services.AddSignalR();

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// Scans entire solution for Validators (FluentValidation)
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

builder.Services.AddAuthorizationBuilder()
        // Configures the Authorization policy to require Identity Cookies by default
        .SetDefaultPolicy(new AuthorizationPolicyBuilder(IdentityConstants.ApplicationScheme)
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddIdentityApiEndpoints<ApplicationUser>(options =>
{
    options.SignIn.RequireConfirmedEmail = true;
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AthletiqaDbContext>();

builder.Services.ConfigureApplicationCookie(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Local Development
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    }
    else
    {
        // Production: cookie over HTTPS. Set CookieDomain (e.g. ".example.com") to share
        // the cookie across subdomains; leave it empty when frontend and API share one origin (Azure).
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        var cookieDomain = builder.Configuration["CookieDomain"];
        if (!string.IsNullOrWhiteSpace(cookieDomain))
            options.Cookie.Domain = cookieDomain;
    }

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
});

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.Configure<CloudinarySettings>(
    builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddScoped<ICloudinaryUploadSignatureService, CloudinaryUploadSignatureService>();

builder.Services.AddDbContext<AthletiqaDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (builder.Environment.IsDevelopment())
    {
        //  Localhost
        options.UseSqlServer(connectionString);
    }
    else
    {
        // Production/Kubernetes
        options.UseSqlServer(connectionString, sqlOptions =>
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: [18456]
            ));
    }
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AthletiqaDbContext>("database")
    .AddCheck("self", () => HealthCheckResult.Healthy());

var app = builder.Build();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => true
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Name == "self"
});

app.MapMetrics("/metrics");

if (args.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AthletiqaDbContext>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    Log.Information("Running database migrations via Kubernetes lifecycle management...");
    await dbContext.Database.MigrateAsync();

    var roles = typeof(Roles)
        .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.DeclaredOnly)
        .Where(f => f.IsLiteral && !f.IsInitOnly)
        .Select(f => (string)f.GetRawConstantValue()!)
        .ToArray();

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }
    Log.Information("Database migrations and role configurations completed successfully.");
    await Log.CloseAndFlushAsync();
    return; // Exit the application after migrations to prevent it from running in an unintended state
}

await DatabaseSeeder.SeedAsync(app);

app.UseCors("AllowReactSPA");

app.UseRouting();

app.UseMiddleware<TracingMiddleware>();

app.UseAuthentication();

app.UseAuthorization();

app.MapGroup("/api").MapIdentityApi<ApplicationUser>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.Theme = ScalarTheme.BluePlanet;
    });
}

app.MapHub<backend.Infrastructure.Hubs.NotificationHub>("/hubs/notification");
app.MapHub<backend.Features.Conversation.Realtime.ConversationHub>("/hubs/conversation");

app.MapCarter();

app.Run();