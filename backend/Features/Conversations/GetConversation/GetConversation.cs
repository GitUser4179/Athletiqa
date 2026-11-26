using backend.Domain.Entities;
using backend.Infrastructure.Database;
using Carter;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Features.Conversations.GetConversation
{
	//Query to get all conversations for a user
	public record ConversationItem(int ConversationId, string UserId, string Name, string? AvatarUrl = null, string? LastMessage = null); //UserId is the other user in the conversation
	public record GetConversationResult(List<ConversationItem> Conversations); //List of conversations for a user
	public record GetConversationQuery(string UserId) : IRequest<GetConversationResult>; //UserId is the aspnet user id of the user for which we want to get the conversations

	//Handler to get all conversations for a user

	public class GetConversationEndpoint : ICarterModule //Endpoint to get all conversations for a user
	{
		public void AddRoutes(IEndpointRouteBuilder app)
		{
			app.MapGet("/api/conversations", async (ClaimsPrincipal user, IMediator mediator) =>
			{
				var aspNetUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(aspNetUserId))
				{
					return Results.Unauthorized();
				}
				var conversations = await mediator.Send(new GetConversationQuery(aspNetUserId));
				return conversations is not null ? Results.Ok(conversations) : Results.NotFound();
			})
			.RequireAuthorization();
		}
	}

	//Result of getting all conversations for a user

	public class GetConversationHandler(AthletiqaDbContext db) : IRequestHandler<GetConversationQuery, GetConversationResult> //Handler to get all conversations for a user
	{
		private readonly AthletiqaDbContext _db = db;

		async Task<GetConversationResult> IRequestHandler<GetConversationQuery, GetConversationResult>.Handle(GetConversationQuery request, CancellationToken cancellationToken)
		{

			//Get all conversations for a user, except with users either side has blocked.
			//(Each "other user" field is picked with its own conditional so EF can translate it to SQL.)
			var uid = request.UserId;
			var rows = await _db.Conversation
				.Where(c => c.FirstUserId == uid || c.SecondUserId == uid)
				.Select(c => new
				{
					c.ConversationId,
					OtherId = c.FirstUserId == uid ? c.SecondUserId : c.FirstUserId,
					FirstName = c.FirstUserId == uid ? c.SecondUser.AspNetUser.FirstName : c.FirstUser.AspNetUser.FirstName,
					LastName = c.FirstUserId == uid ? c.SecondUser.AspNetUser.LastName : c.FirstUser.AspNetUser.LastName,
					AthletePhoto = c.FirstUserId == uid ? c.SecondUser.AthleteProfile!.PhotoUrl : c.FirstUser.AthleteProfile!.PhotoUrl,
					SponsorPhoto = c.FirstUserId == uid ? c.SecondUser.SponsorProfile!.PhotoUrl : c.FirstUser.SponsorProfile!.PhotoUrl,
					LastMessage = c.Messages.OrderByDescending(m => m.TimeStamp).Select(m => m.Content).FirstOrDefault(),
					LastAt = c.Messages.Max(m => (DateTime?)m.TimeStamp),
				})
				.Where(x => !_db.UserBlock.Any(b =>
					(b.BlockerId == uid && b.BlockedId == x.OtherId) ||
					(b.BlockerId == x.OtherId && b.BlockedId == uid)))
				.OrderByDescending(x => x.LastAt)
				.ToListAsync(cancellationToken);

			var conversationItems = rows
				.Select(x => new ConversationItem(
					x.ConversationId,
					x.OtherId,
					$"{x.FirstName} {x.LastName}",
					x.AthletePhoto ?? x.SponsorPhoto,
					x.LastMessage))
				.ToList();

			return new GetConversationResult(conversationItems);
		}

	}	

	
}
