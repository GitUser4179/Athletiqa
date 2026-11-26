using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Likes.UnlikePost
{
	public class UnlikePostEndpoint : ICarterModule
	{
		public void AddRoutes(IEndpointRouteBuilder app)
		{

			app.MapDelete("/api/posts/{postId}/like", async (int postId, ClaimsPrincipal user, ISender mediator, CancellationToken cancellationToken) =>
			{
				// Get the ASP.NET Identity user ID from the claims
				var aspNetUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(aspNetUserId))
				{
					return Results.Unauthorized();
				}
				// Create and send the command to unlike the post
				var result = await mediator.Send(new UnlikePostCommand { UserId = aspNetUserId, PostId = postId }, cancellationToken);

				// Check the result and return the appropriate response
				if (!result.Success)
				{
					return Results.BadRequest(new { result.Errors });
				}

				// Return the successful response with the updated like count and status
				return Results.Ok(result);
			}).RequireAuthorization();

		}
	}
}
