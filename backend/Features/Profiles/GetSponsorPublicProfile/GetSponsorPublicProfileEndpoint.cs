using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.Profiles.GetSponsorPublicProfile;

public class GetSponsorPublicProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/sponsors/{publicProfileId:int}", async (
            int publicProfileId,
            ClaimsPrincipal user,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var result = await sender.Send(
                new GetSponsorPublicProfileQuery(publicProfileId, user.FindFirstValue(ClaimTypes.NameIdentifier)),
                cancellationToken);

            return result is null
                ? Results.NotFound()
                : Results.Ok(result);
        });
    }
}
