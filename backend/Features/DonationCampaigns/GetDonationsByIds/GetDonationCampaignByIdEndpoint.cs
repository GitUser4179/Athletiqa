using Carter;
using MediatR;
using System.Security.Claims;

namespace backend.Features.DonationCampaigns.GetDonationsByIds;

public class GetDonationCampaignByIdModule : ICarterModule
{
	public void AddRoutes(IEndpointRouteBuilder app)
	{
		app.MapGet("/api/donation-campaigns/{id:int}", async (int id, ClaimsPrincipal user, ISender mediator) =>
		{
			var result = await mediator.Send(new GetDonationCampaignByIdQuery(id, user.FindFirstValue(ClaimTypes.NameIdentifier)));
			return result is not null ? Results.Ok(result) : Results.NotFound();
		});
	}
}