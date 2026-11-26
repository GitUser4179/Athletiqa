using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Donations
{
    public class GetDonationsHandler : IRequestHandler<GetDonationsQuery, List<GetDonationsResponse>>
    {
        private readonly AthletiqaDbContext _context;

        public GetDonationsHandler(AthletiqaDbContext context)
        {
            _context = context;
        }

        public async Task<List<GetDonationsResponse>> Handle(GetDonationsQuery request, CancellationToken cancellationToken)
        {

            var donationsList = await _context.Donation.Where(d => d.CampaignId == request.campaignId && d.Status == "succeeded")
                                          .OrderByDescending(d => d.CreatedAt)
                                          .Select(d => new GetDonationsResponse(
                                              d.Sponsor != null && d.Sponsor.User.PrivacySetting != null && d.Sponsor.User.PrivacySetting.AnonymousDonations
                                                  ? "Anonym" : d.DonorName,
                                              d.Amount, d.CreatedAt))
                                          .ToListAsync(cancellationToken);

            return donationsList;

        }
    }
}
