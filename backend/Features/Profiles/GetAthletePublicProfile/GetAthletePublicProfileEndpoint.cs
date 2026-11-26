using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Profiles.GetAthletePublicProfile;

public class GetAthletePublicProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/athletes/{publicProfileId:int}", async (
            int publicProfileId,
            ClaimsPrincipal user,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var result = await sender.Send(
                new GetAthletePublicProfileQuery(publicProfileId, user.FindFirstValue(ClaimTypes.NameIdentifier)),
                cancellationToken);

            return result is null
                ? Results.NotFound()
                : Results.Ok(result);
        });
    }
}
