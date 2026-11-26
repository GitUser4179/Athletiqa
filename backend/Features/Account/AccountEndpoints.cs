using backend.Domain.Entities;
using backend.Infrastructure.Database;
using Carter;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Features.Account;

public record PrivacyRequest(bool Anonymous);
public record PrivacyResponse(bool Anonymous);

public class AccountEndpoints : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		// Anonymity: hides the user's name/photo on comments and donations, and hides a sponsor's public profile
		app.MapGet("/api/users/me/privacy", async (ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var anonymous = await db.PrivacySetting
				.Where(p => p.UserId == userId)
				.Select(p => p.AnonymousDonations)
				.FirstOrDefaultAsync(ct);
			return Results.Ok(new PrivacyResponse(anonymous));
		}).RequireAuthorization();

		app.MapPut("/api/users/me/privacy", async (
			PrivacyRequest request, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var setting = await db.PrivacySetting.FirstOrDefaultAsync(p => p.UserId == userId, ct);
			if (setting is null)
			{
				setting = new PrivacySetting { UserId = userId, PublicProfile = true, ShowInSearch = true };
				db.PrivacySetting.Add(setting);
			}
			setting.AnonymousDonations = request.Anonymous;
			await db.SaveChangesAsync(ct);

			return Results.Ok(new PrivacyResponse(setting.AnonymousDonations));
		}).RequireAuthorization();

		// Permanently deletes the logged in user's account and data, then signs them out.
		// Donations a sponsor made stay on the campaigns (so totals are kept) but are detached and shown as "Anonym".
		app.MapDelete("/api/users/me", async (
			ClaimsPrincipal user,
			AthletiqaDbContext db,
			UserManager<ApplicationUser> userManager,
			SignInManager<ApplicationUser> signInManager,
			ILogger<AccountEndpoints> logger,
			CancellationToken ct) =>
		{
			var uid = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(uid)) return Results.Unauthorized();

			var aspNetUser = await userManager.FindByIdAsync(uid);
			if (aspNetUser is null) return Results.NotFound();

			// Production uses EnableRetryOnFailure, which requires manual transactions to run inside the execution strategy
			var strategy = db.Database.CreateExecutionStrategy();
			await strategy.ExecuteAsync(async () =>
			{
				await using var tx = await db.Database.BeginTransactionAsync(ct);

				// Chats the user is part of
				var conversationIds = db.Conversation
					.Where(c => c.FirstUserId == uid || c.SecondUserId == uid)
					.Select(c => c.ConversationId);
				await db.Message.Where(m => conversationIds.Contains(m.ConversationId) || m.SenderId == uid).ExecuteDeleteAsync(ct);
				await db.Conversation.Where(c => c.FirstUserId == uid || c.SecondUserId == uid).ExecuteDeleteAsync(ct);

				// Follows and blocks in both directions
				await db.UserBlock.Where(b => b.BlockerId == uid || b.BlockedId == uid).ExecuteDeleteAsync(ct);
				await db.AthleteFollow.Where(f => f.FollowerId == uid || f.AthleteId == uid).ExecuteDeleteAsync(ct);

				// The user's likes and comments on other posts
				await db.PostLike.Where(l => l.UserId == uid).ExecuteDeleteAsync(ct);
				await db.Comment.Where(c => c.UserId == uid).ExecuteDeleteAsync(ct);

				// The user's own posts and campaigns, with everything attached to them
				var postIds = db.Post.Where(p => p.AthleteId == uid || p.CreatedBy == uid).Select(p => p.PostId);
				var campaignIds = db.DonationCampaign.Where(c => postIds.Contains(c.PostId)).Select(c => c.DonationCampaignId);
				await db.Donation.Where(d => campaignIds.Contains(d.CampaignId)).ExecuteDeleteAsync(ct);
				await db.DonationCampaign.Where(c => postIds.Contains(c.PostId)).ExecuteDeleteAsync(ct);
				await db.PostLike.Where(l => postIds.Contains(l.PostId)).ExecuteDeleteAsync(ct);
				await db.Comment.Where(c => postIds.Contains(c.PostId)).ExecuteDeleteAsync(ct);
				await db.MediaContent.Where(m => postIds.Contains(m.PostId)).ExecuteDeleteAsync(ct);
				await db.Post.Where(p => p.AthleteId == uid || p.CreatedBy == uid).ExecuteDeleteAsync(ct);

				// Donations made as a sponsor: keep the money on the campaign, drop the link to the user
				await db.Donation
					.Where(d => d.SponsorId == uid)
					.ExecuteUpdateAsync(s => s
						.SetProperty(d => d.SponsorId, (string?)null)
						.SetProperty(d => d.DonorName, "Anonym"), ct);

				// Profile data
				await db.Notification.Where(n => n.UserId == uid).ExecuteDeleteAsync(ct);
				await db.AthleteSport.Where(s => s.AthleteId == uid).ExecuteDeleteAsync(ct);
				await db.PrivacySetting.Where(p => p.UserId == uid).ExecuteDeleteAsync(ct);
				await db.NotificationSetting.Where(n => n.UserId == uid).ExecuteDeleteAsync(ct);
				await db.AthleteProfile.Where(a => a.UserId == uid).ExecuteDeleteAsync(ct);
				await db.SponsorProfile.Where(s => s.UserId == uid).ExecuteDeleteAsync(ct);
				await db.AppUsers.Where(u => u.UserId == uid).ExecuteDeleteAsync(ct);

				// Identity user (roles, claims, logins)
				var result = await userManager.DeleteAsync(aspNetUser);
				if (!result.Succeeded)
					throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Description)));

				await tx.CommitAsync(ct);
			});

			logger.LogInformation("Account {UserId} deleted", uid);
			await signInManager.SignOutAsync();
			return Results.NoContent();
		}).RequireAuthorization();
	}
}
