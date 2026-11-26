using backend.Domain.Entities;
using backend.Infrastructure.Database;
using Carter;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Features.Social.Blocks;

public record BlockedUserItem(string Type, int PublicProfileId, string Name, string? PhotoUrl);

public class BlockEndpoints : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		// List the users I have blocked
		app.MapGet("/api/users/me/blocks", async (ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var blocked = await db.UserBlock
				.Where(b => b.BlockerId == userId)
				.OrderByDescending(b => b.CreatedAt)
				.Select(b => new
				{
					Athlete = b.Blocked.AthleteProfile,
					Sponsor = b.Blocked.SponsorProfile,
					b.Blocked.AspNetUser.FirstName,
					b.Blocked.AspNetUser.LastName,
				})
				.ToListAsync(ct);

			var items = blocked.Select(b => b.Athlete != null
				? new BlockedUserItem(SocialHelpers.Athlete, b.Athlete.PublicProfileId, $"{b.FirstName} {b.LastName}", b.Athlete.PhotoUrl)
				: new BlockedUserItem(SocialHelpers.Sponsor, b.Sponsor?.PublicProfileId ?? 0, b.Sponsor?.Name ?? $"{b.FirstName} {b.LastName}", b.Sponsor?.PhotoUrl))
				.ToList();

			return Results.Ok(items);
		}).RequireAuthorization();

		// Block a user
		app.MapPost("/api/blocks", async (ProfileRef target, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var targetId = await db.ResolveUserIdAsync(target.Type, target.PublicProfileId, ct);
			if (targetId is null) return Results.NotFound(new { message = "User not found." });
			if (targetId == userId) return Results.BadRequest(new { message = "You can't block yourself." });

			if (!await db.UserBlock.AnyAsync(b => b.BlockerId == userId && b.BlockedId == targetId, ct))
			{
				db.UserBlock.Add(new UserBlock { BlockerId = userId, BlockedId = targetId });
				await db.SaveChangesAsync(ct);
			}

			// Blocking also removes follows in both directions
			await db.AthleteFollow
				.Where(f => (f.FollowerId == userId && f.AthleteId == targetId) ||
							(f.FollowerId == targetId && f.AthleteId == userId))
				.ExecuteDeleteAsync(ct);

			return Results.NoContent();
		}).RequireAuthorization();

		// Unblock a user
		app.MapDelete("/api/blocks/{type}/{publicProfileId:int}", async (
			string type, int publicProfileId, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var targetId = await db.ResolveUserIdAsync(type, publicProfileId, ct);
			if (targetId is null) return Results.NotFound(new { message = "User not found." });

			await db.UserBlock
				.Where(b => b.BlockerId == userId && b.BlockedId == targetId)
				.ExecuteDeleteAsync(ct);

			return Results.NoContent();
		}).RequireAuthorization();
	}
}
