using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;
using backend.Features.Posts.GetComments;

namespace backend.Features.Posts.Comments;

public class GetCommentHandler(AthletiqaDbContext db) : IRequestHandler<GetCommentQuery, List<GetCommentResponse>>
{
	private const string AnonymousName = "Anonym användare";

	public async Task<List<GetCommentResponse>> Handle(GetCommentQuery query, CancellationToken cancellationToken)
	{
		var comments = db.Comment.Where(c => c.PostId == query.PostId);

		// Hide comments from users in a block relation with the viewer
		if (!string.IsNullOrEmpty(query.CurrentUserId))
		{
			comments = comments.Where(c => !db.UserBlock.Any(b =>
				(b.BlockerId == query.CurrentUserId && b.BlockedId == c.UserId) ||
				(b.BlockerId == c.UserId && b.BlockedId == query.CurrentUserId)));
		}

		var rows = await comments
			.OrderByDescending(c => c.CreatedAt)
			.Select(c => new
			{
				c.Id,
				c.UserId,
				c.Content,
				c.CreatedAt,
				c.User.AspNetUser.FirstName,
				c.User.AspNetUser.LastName,
				Athlete = c.User.AthleteProfile,
				Sponsor = c.User.SponsorProfile,
				IsAnonymous = c.User.PrivacySetting != null && c.User.PrivacySetting.AnonymousDonations,
			})
			.ToListAsync(cancellationToken);

		return rows.Select(c =>
		{
			// Anonymous users are shown without name, photo or profile link (except to themselves)
			if (c.IsAnonymous && c.UserId != query.CurrentUserId)
				return new GetCommentResponse(c.Id, AnonymousName, null, "company", c.Content, c.CreatedAt);

			return c.Athlete != null
				? new GetCommentResponse(c.Id, $"{c.FirstName} {c.LastName}", c.Athlete.PhotoUrl,
					((int)c.Athlete.Gender).ToString(), c.Content, c.CreatedAt, "athlete", c.Athlete.PublicProfileId)
				: new GetCommentResponse(c.Id, $"{c.FirstName} {c.LastName}", c.Sponsor?.PhotoUrl,
					"company", c.Content, c.CreatedAt, c.Sponsor != null ? "sponsor" : null, c.Sponsor?.PublicProfileId);
		}).ToList();
	}
}
