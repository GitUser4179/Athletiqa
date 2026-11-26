using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Likes.LikePost
{

	public class LikePostEndpoint : ICarterModule
	{

		public void AddRoutes(IEndpointRouteBuilder app)
		{
			app.MapPost("/api/posts/{postId}/like", async (int postId,ClaimsPrincipal user, ISender mediator, CancellationToken cancellationToken) =>
			{
				// Get the ASP.NET Identity user ID from the claims
				var aspNetUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(aspNetUserId))
				{
					return Results.Unauthorized();
				}
				// Send the LikePostCommand to the MediatR pipeline
				var result = await mediator.Send(new LikePostCommand { UserId = aspNetUserId, PostId = postId }, cancellationToken);

				// Check the result and return the appropriate HTTP response
				if (!result.Success)
				{
					return Results.BadRequest(new { result.Errors });
				}

				// Return the successful result
				return Results.Ok(result);
			}).RequireAuthorization();
		}

	}
}
