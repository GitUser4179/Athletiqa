using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Profiles.GetAthletePublicProfilePosts;

public class GetAthletePublicProfilePostsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/athletes/{publicProfileId:int}/posts", async (
            int publicProfileId,
            ClaimsPrincipal user,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var posts = await sender.Send(
                new GetAthletePublicProfilePostsQuery(publicProfileId, user.FindFirstValue(ClaimTypes.NameIdentifier)),
                cancellationToken);

            return Results.Ok(posts);
        });
    }
}
