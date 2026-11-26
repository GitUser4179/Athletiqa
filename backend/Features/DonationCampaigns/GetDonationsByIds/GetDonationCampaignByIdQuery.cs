using backend.Features.DonationCampaigns.GetDonations;
using MediatR;

namespace backend.Features.DonationCampaigns.GetDonationsByIds;

public record GetDonationCampaignByIdQuery(int Id, string? CurrentUserId = null) : IRequest<GetDonationCampaignResponse?>;