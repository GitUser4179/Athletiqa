using backend.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Social;

// A user referenced the way public pages know them: by profile type + public profile id.
// (Public routes never expose the internal user id.)
public record ProfileRef(string Type, int PublicProfileId);

public static class SocialHelpers
{
	public const string Athlete = "athlete";
	public const string Sponsor = "sponsor";

	// Resolves a public profile reference to the internal user id, or null if it doesn't exist.
	public static async Task<string?> ResolveUserIdAsync(
		this AthletiqaDbContext db, string type, int publicProfileId, CancellationToken ct = default)
	{
		return type?.ToLowerInvariant() switch
		{
			Athlete => await db.AthleteProfile
				.Where(a => a.PublicProfileId == publicProfileId)
				.Select(a => a.UserId)
				.FirstOrDefaultAsync(ct),
			Sponsor => await db.SponsorProfile
				.Where(s => s.PublicProfileId == publicProfileId)
				.Select(s => s.UserId)
				.FirstOrDefaultAsync(ct),
			_ => null
		};
	}

	// True if either user has blocked the other.
	public static Task<bool> IsBlockedBetweenAsync(
		this AthletiqaDbContext db, string? userA, string? userB, CancellationToken ct = default)
	{
		if (string.IsNullOrEmpty(userA) || string.IsNullOrEmpty(userB))
			return Task.FromResult(false);

		return db.UserBlock.AnyAsync(b =>
			(b.BlockerId == userA && b.BlockedId == userB) ||
			(b.BlockerId == userB && b.BlockedId == userA), ct);
	}
}
