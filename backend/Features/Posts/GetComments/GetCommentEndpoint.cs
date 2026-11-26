using Carter;
using backend.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Posts.Comments;

public class GetCommentModule : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		app.MapGet("/api/posts/{postId}/comments", async (int postId, ClaimsPrincipal user, ISender mediator) =>
		{
			var query = new GetCommentQuery(postId, user.FindFirstValue(ClaimTypes.NameIdentifier));
			var comments = await mediator.Send(query);
			return Results.Ok(comments);
        });
	}
}