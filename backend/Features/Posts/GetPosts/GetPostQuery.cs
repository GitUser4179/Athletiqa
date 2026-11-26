using MediatR;

namespace backend.Features.Posts.GetPosts;

public record GetPostQuery( string? searchWord, string? AthleteId = null, string? CurrentUserId = null) : IRequest<List<GetPostResponse>>;
