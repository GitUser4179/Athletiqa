using backend.Infrastructure.Database;
using backend.Features.Posts.GetPosts;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Posts.GetPostById;

public class GetPostByIdHandler(AthletiqaDbContext db) : IRequestHandler<GetPostByIdQuery, GetPostResponse?>
{
    public async Task<GetPostResponse?> Handle(GetPostByIdQuery request, CancellationToken cancellationToken)
    {
        return await db.Post
            .Include(p => p.MediaContents)
            .AsNoTracking()
            .Where(p => p.PostId == request.PostId)
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
                request.CurrentUserId != null && db.AthleteFollow.Any(f => f.AthleteId == p.AthleteId && f.FollowerId == request.CurrentUserId),
                request.CurrentUserId != null && p.AthleteId == request.CurrentUserId))
            .FirstOrDefaultAsync(cancellationToken);
    }
}