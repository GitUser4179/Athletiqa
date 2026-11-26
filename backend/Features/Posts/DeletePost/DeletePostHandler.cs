using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Posts.DeletePost;

public class DeletePostHandler(AthletiqaDbContext db) : IRequestHandler<DeletePostCommand, IResult>
{
	public async Task<IResult> Handle(DeletePostCommand request, CancellationToken cancellationToken)
	{
		var post = await db.Post
			.FirstOrDefaultAsync(p => p.PostId == request.PostId, cancellationToken);

		if (post is null)
			return Results.NotFound($"Post med id {request.PostId} hittas inte");
		// makes sure active user is same as creator of post
		if(request.ActiveUserId != post.CreatedBy)
		{
			return Results.StatusCode(StatusCodes.Status403Forbidden);
		}


		db.Post.Remove(post);

		await db.SaveChangesAsync(cancellationToken);

		return Results.NoContent();
	}
}
