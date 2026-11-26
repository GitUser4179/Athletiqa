using backend.Features.Conversations.GetConversation;
using backend.Features.Social;
using backend.Infrastructure.Database;
using Carter;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ConversationEntity = backend.Domain.Entities.Conversation;

namespace backend.Features.Conversations.StartConversation;

// Opens the conversation between the logged in user and another user (from their public profile),
// creating it if it doesn't exist yet. Returns the same shape as the conversation list items.
public class StartConversationEndpoint : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		app.MapPost("/api/conversations", async (
			ProfileRef target, ClaimsPrincipal user, AthletiqaDbContext db, CancellationToken ct) =>
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

			var otherId = await db.ResolveUserIdAsync(target.Type, target.PublicProfileId, ct);
			if (otherId is null) return Results.NotFound(new { message = "User not found." });
			if (otherId == userId) return Results.BadRequest(new { message = "You can't message yourself." });
			if (await db.IsBlockedBetweenAsync(userId, otherId, ct))
				return Results.Json(new { message = "You can't message this user." }, statusCode: StatusCodes.Status403Forbidden);

			var conversation = await db.Conversation.FirstOrDefaultAsync(c =>
				(c.FirstUserId == userId && c.SecondUserId == otherId) ||
				(c.FirstUserId == otherId && c.SecondUserId == userId), ct);

			if (conversation is null)
			{
				conversation = new ConversationEntity { FirstUserId = userId, SecondUserId = otherId };
				db.Conversation.Add(conversation);
				await db.SaveChangesAsync(ct);
			}

			var other = await db.AppUsers
				.Where(u => u.UserId == otherId)
				.Select(u => new
				{
					u.AspNetUser.FirstName,
					u.AspNetUser.LastName,
					AvatarUrl = u.AthleteProfile != null ? u.AthleteProfile.PhotoUrl : u.SponsorProfile!.PhotoUrl,
					LastMessage = db.Message
						.Where(m => m.ConversationId == conversation.ConversationId)
						.OrderByDescending(m => m.TimeStamp)
						.Select(m => m.Content)
						.FirstOrDefault()
				})
				.FirstAsync(ct);

			return Results.Ok(new ConversationItem(
				conversation.ConversationId,
				otherId,
				$"{other.FirstName} {other.LastName}",
				other.AvatarUrl,
				other.LastMessage));
		}).RequireAuthorization();
	}
}
