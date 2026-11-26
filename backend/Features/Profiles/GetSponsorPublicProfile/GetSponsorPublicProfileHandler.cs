using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Profiles.GetSponsorPublicProfile;

public class GetSponsorPublicProfileHandler(AthletiqaDbContext db)
    : IRequestHandler<GetSponsorPublicProfileQuery, GetSponsorPublicProfileResponse?>
{
    public async Task<GetSponsorPublicProfileResponse?> Handle(
        GetSponsorPublicProfileQuery request,
        CancellationToken cancellationToken)
    {
        return await db.SponsorProfile
            .AsNoTracking()
            .Where(s => s.PublicProfileId == request.PublicProfileId)
            // Hidden (404) when the sponsor is anonymous or either side has blocked the other
            .Where(s => s.UserId == request.CurrentUserId || !(s.User.PrivacySetting != null && s.User.PrivacySetting.AnonymousDonations))
            .Where(s => request.CurrentUserId == null || !db.UserBlock.Any(b =>
                (b.BlockerId == request.CurrentUserId && b.BlockedId == s.UserId) ||
                (b.BlockerId == s.UserId && b.BlockedId == request.CurrentUserId)))
            .Select(s => new GetSponsorPublicProfileResponse(
                s.PublicProfileId,
                s.Name,
                s.Description,
                s.PhotoUrl,
                request.CurrentUserId != null && s.UserId == request.CurrentUserId
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
