using MediatR;
using backend.Features.Posts.GetComments;

namespace backend.Features.Posts.Comments;

public record GetCommentQuery(int PostId, string? CurrentUserId = null) : IRequest<List<GetCommentResponse>>;
