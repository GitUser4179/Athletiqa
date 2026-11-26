using backend.Features.DonationCampaigns.GetDonations;
using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.DonationCampaigns.GetDonationsByIds;

public class GetDonationCampaignByIdHandler(AthletiqaDbContext db)
    : IRequestHandler<GetDonationCampaignByIdQuery, GetDonationCampaignResponse?>
{
    public async Task<GetDonationCampaignResponse?> Handle(GetDonationCampaignByIdQuery request, CancellationToken cancellationToken)
    {
		// Retrieve a specific donation campaign by its ID,
		// including related post and athlete information, and return it as a response.
		return await db.DonationCampaign
            .AsNoTracking()
            .Include(d => d.Post)
            .ThenInclude(p => p.Athlete.User.AspNetUser)
            .Where(d => d.DonationCampaignId == request.Id)
            .Select(d => new GetDonationCampaignResponse(
                d.DonationCampaignId,
                d.Post.Athlete.PublicProfileId,
                d.Post.Title,
                d.Post.Content,
                d.GoalAmount,
                d.CurrentAmount,
                d.Post.MediaContents.Select(m => m.MediaUrl).FirstOrDefault(),
                d.Post.Athlete.User.AspNetUser.FirstName + " " + d.Post.Athlete.User.AspNetUser.LastName,
                d.Post.Athlete.PhotoUrl,
                (int)d.Post.Athlete.Gender,
                d.Post.CreatedAt,
                d.Post.MediaContents.OrderBy(m => m.MediaContentId).Select(m => m.MediaUrl).ToList(),
                request.CurrentUserId != null && db.AthleteFollow.Any(f => f.AthleteId == d.Post.AthleteId && f.FollowerId == request.CurrentUserId),
                request.CurrentUserId != null && d.Post.AthleteId == request.CurrentUserId
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
