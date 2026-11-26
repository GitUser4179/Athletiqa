using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Posts.GetPosts;

public class GetPostModule : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		app.MapGet("/api/posts", async (ISender mediator, ClaimsPrincipal user, string? search) =>
		{
			var posts = await mediator.Send(new GetPostQuery(search, CurrentUserId: user.FindFirstValue(ClaimTypes.NameIdentifier)));
			return Results.Ok(posts);
		});

        app.MapGet("/api/users/me/posts", async (ClaimsPrincipal user, ISender mediator) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Results.Unauthorized();
            }

            var posts = await mediator.Send(new GetPostQuery(searchWord: null, AthleteId: userId, CurrentUserId: userId));
            return Results.Ok(posts);
        }).RequireAuthorization();
    }
}
