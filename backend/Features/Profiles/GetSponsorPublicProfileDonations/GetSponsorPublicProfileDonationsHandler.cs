using backend.Domain.Enums;
using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Profiles.GetSponsorPublicProfileDonations;

public class GetSponsorPublicProfileDonationsHandler(AthletiqaDbContext db)
    : IRequestHandler<GetSponsorPublicProfileDonationsQuery, List<GetSponsorPublicProfileDonationResponse>>
{
    public async Task<List<GetSponsorPublicProfileDonationResponse>> Handle(
        GetSponsorPublicProfileDonationsQuery request,
        CancellationToken cancellationToken)
    {
        var hasPublicProfileId = request.PublicProfileId is not null;
        var hasSponsorId = !string.IsNullOrWhiteSpace(request.SponsorId);

        if (hasPublicProfileId == hasSponsorId)
        {
            throw new ArgumentException("Exactly one sponsor identifier must be provided.");
        }

        var query = db.Donation
            .AsNoTracking()
            .Where(d => d.Status == "succeeded" && d.Sponsor != null);

        if (request.PublicProfileId is not null)
        {
            query = query.Where(d => d.Sponsor!.PublicProfileId == request.PublicProfileId &&
                !(d.Sponsor.User.PrivacySetting != null && d.Sponsor.User.PrivacySetting.AnonymousDonations));
        }
        
        if (!string.IsNullOrWhiteSpace(request.SponsorId))
        {
            query = query.Where(d => d.SponsorId == request.SponsorId);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new GetSponsorPublicProfileDonationResponse(
                d.DonationId,
                d.CampaignId,
                d.Campaign.Post.Athlete.PublicProfileId,
                d.Campaign.Post.Title,
                d.Campaign.Post.Content,
                d.Campaign.GoalAmount,
                d.Campaign.CurrentAmount,
                d.Campaign.Post.MediaContents.Select(m => m.MediaUrl).FirstOrDefault(),
                d.Campaign.Post.MediaContents
                    .Select(m => m.MediaType == MediaType.Video ? "video" : "image")
                    .FirstOrDefault(),
                d.Amount,
                d.CreatedAt,
                d.Campaign.Post.Athlete.User.AspNetUser.FirstName + " " + d.Campaign.Post.Athlete.User.AspNetUser.LastName,
                d.Campaign.Post.Athlete.PhotoUrl,
                (int)d.Campaign.Post.Athlete.Gender
            ))
            .ToListAsync(cancellationToken);
    }
}
