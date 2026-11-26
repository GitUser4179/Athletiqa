using backend.Domain.Entities;
using backend.Infrastructure.Database;
using Carter;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Features.Social.Follows;

public record FollowResponse(bool IsFollowing, int FollowerCount);
public record FollowStatsResponse(int Followers, int Following);

public class FollowEndpoints : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		// Follow an athlete
		app.MapPost("/api/athletes/{publicProfileId:int}/follow", async (
			int publicProfileId, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var athleteId = await db.ResolveUserIdAsync(SocialHelpers.Athlete, publicProfileId, ct);
			if (athleteId is null) return Results.NotFound(new { message = "Athlete not found." });
			if (athleteId == userId) return Results.BadRequest(new { message = "You can't follow yourself." });
			if (await db.IsBlockedBetweenAsync(userId, athleteId, ct)) return Results.NotFound(new { message = "Athlete not found." });

			var alreadyFollowing = await db.AthleteFollow.AnyAsync(f => f.FollowerId == userId && f.AthleteId == athleteId, ct);
			if (!alreadyFollowing)
			{
				db.AthleteFollow.Add(new AthleteFollow { FollowerId = userId, AthleteId = athleteId });
				await db.SaveChangesAsync(ct);
			}

			var count = await db.AthleteFollow.CountAsync(f => f.AthleteId == athleteId, ct);
			return Results.Ok(new FollowResponse(true, count));
		}).RequireAuthorization();

		// Unfollow an athlete
		app.MapDelete("/api/athletes/{publicProfileId:int}/follow", async (
			int publicProfileId, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var athleteId = await db.ResolveUserIdAsync(SocialHelpers.Athlete, publicProfileId, ct);
			if (athleteId is null) return Results.NotFound(new { message = "Athlete not found." });

			await db.AthleteFollow
				.Where(f => f.FollowerId == userId && f.AthleteId == athleteId)
				.ExecuteDeleteAsync(ct);

			var count = await db.AthleteFollow.CountAsync(f => f.AthleteId == athleteId, ct);
			return Results.Ok(new FollowResponse(false, count));
		}).RequireAuthorization();

		// Follower / following counts for the logged in user's own profile
		app.MapGet("/api/users/me/follow-stats", async (
			ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var followers = await db.AthleteFollow.CountAsync(f => f.AthleteId == userId, ct);
			var following = await db.AthleteFollow.CountAsync(f => f.FollowerId == userId, ct);
			return Results.Ok(new FollowStatsResponse(followers, following));
		}).RequireAuthorization();
	}
}
