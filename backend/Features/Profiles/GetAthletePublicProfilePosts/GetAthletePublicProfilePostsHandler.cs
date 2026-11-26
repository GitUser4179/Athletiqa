using backend.Domain.Enums;
using backend.Features.Posts.GetPosts;
using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Profiles.GetAthletePublicProfilePosts;

public class GetAthletePublicProfilePostsHandler(AthletiqaDbContext db)
    : IRequestHandler<GetAthletePublicProfilePostsQuery, List<GetPostResponse>>
{
    public async Task<List<GetPostResponse>> Handle(
        GetAthletePublicProfilePostsQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Post
            .AsNoTracking()
            .Where(p =>
                p.DonationCampaign == null &&
                p.Athlete.PublicProfileId == request.PublicProfileId &&
                (request.CurrentUserId == null || !db.UserBlock.Any(b =>
                    (b.BlockerId == request.CurrentUserId && b.BlockedId == p.AthleteId) ||
                    (b.BlockerId == p.AthleteId && b.BlockedId == request.CurrentUserId))))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new GetPostResponse(
                p.PostId,
                p.Athlete.PublicProfileId,
                p.Title,
                p.Content,
                p.MediaContents
                    .Select(m => new GetPostMediaResponse(
                        m.MediaUrl,
                        m.CloudinaryPublicId,
                        m.MediaType == MediaType.Video ? "video" : "image"
                ))
                    .ToList(),
                p.Athlete.User.AspNetUser.FirstName + " " + p.Athlete.User.AspNetUser.LastName,
                p.Athlete.PhotoUrl,
                (int)p.Athlete.Gender,
                p.CreatedAt,
                p.Likes.Count(),
                p.Comments.Count(),
                request.CurrentUserId != null && p.Likes.Any(l => l.UserId == request.CurrentUserId),
                request.CurrentUserId != null && db.AthleteFollow.Any(f => f.AthleteId == p.AthleteId && f.FollowerId == request.CurrentUserId)
            ))
            .ToListAsync(cancellationToken);
    }
}
