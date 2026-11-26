using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Posts.GetPosts;

public class GetPostHandler(AthletiqaDbContext db) : IRequestHandler<GetPostQuery, List<GetPostResponse>>
{
    public async Task<List<GetPostResponse>> Handle(GetPostQuery request, CancellationToken cancellationToken)
    {

        var result = db.Post
            .Include(p => p.MediaContents)
            .AsNoTracking() // Optimize for read-only access since we are not modifying the entities.
            .Where(p => p.DonationCampaign == null);// Only regular posts

        if (!string.IsNullOrWhiteSpace(request.CurrentUserId))
        {
            result = result.Where(p => !db.UserBlock.Any(b =>
                (b.BlockerId == request.CurrentUserId && b.BlockedId == p.AthleteId) ||
                (b.BlockerId == p.AthleteId && b.BlockedId == request.CurrentUserId)));
        }

        if (!string.IsNullOrWhiteSpace(request.AthleteId))
        {
            result = result.Where(p => p.AthleteId == request.AthleteId);
        }

        // check if optional search params exist and if so check if they match properties of the posts
        if (!string.IsNullOrWhiteSpace(request.searchWord))
        {
            result = result.Where(p =>
            p.Title.Contains(request.searchWord) ||
            p.Content.Contains(request.searchWord));

		}

        result = result.OrderByDescending(p => p.CreatedAt);

        return await result
            .Select(p => new GetPostResponse(
                p.PostId,
                p.Athlete.PublicProfileId,
                p.Title,
                p.Content,
                p.MediaContents.Select(m => new GetPostMediaResponse(
                    m.MediaUrl,
                    m.CloudinaryPublicId,
                    m.MediaType == backend.Domain.Enums.MediaType.Video ? "video" : "image"
                )).ToList(),
                p.Athlete.User.AspNetUser.FirstName + " " + p.Athlete.User.AspNetUser.LastName,
                p.Athlete.PhotoUrl,
                (int)p.Athlete.Gender,
                p.CreatedAt,
                p.Likes.Count(),
                p.Comments.Count(),
                request.CurrentUserId != null && p.Likes.Any(l => l.UserId == request.CurrentUserId),
                request.CurrentUserId != null && db.AthleteFollow.Any(f => f.AthleteId == p.AthleteId && f.FollowerId == request.CurrentUserId)))
            .ToListAsync(cancellationToken);
    }
}
