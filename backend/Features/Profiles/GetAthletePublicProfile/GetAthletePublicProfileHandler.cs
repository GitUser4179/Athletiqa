using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Profiles.GetAthletePublicProfile;

public class GetAthletePublicProfileHandler(AthletiqaDbContext db)
    : IRequestHandler<GetAthletePublicProfileQuery, GetAthletePublicProfileResponse?>
{
    public async Task<GetAthletePublicProfileResponse?> Handle(
        GetAthletePublicProfileQuery request,
        CancellationToken cancellationToken)
    {
        return await db.AthleteProfile
            .AsNoTracking()
            .Where(a => a.PublicProfileId == request.PublicProfileId)
            // Hidden (404) when the viewer and the athlete have blocked each other
            .Where(a => request.CurrentUserId == null || !db.UserBlock.Any(b =>
                (b.BlockerId == request.CurrentUserId && b.BlockedId == a.UserId) ||
                (b.BlockerId == a.UserId && b.BlockedId == request.CurrentUserId)))
            .Select(a => new GetAthletePublicProfileResponse(
                a.PublicProfileId,
                a.User.AspNetUser.FirstName + " " + a.User.AspNetUser.LastName,
                a.Bio,
                a.PhotoUrl,
                (int)a.Gender,
                a.Sports
                    .Select(athleteSport => athleteSport.Sport.Name)
                    .ToList(),
                db.AthleteFollow.Count(f => f.AthleteId == a.UserId),
                request.CurrentUserId != null && db.AthleteFollow.Any(f => f.AthleteId == a.UserId && f.FollowerId == request.CurrentUserId),
                request.CurrentUserId != null && a.UserId == request.CurrentUserId
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
