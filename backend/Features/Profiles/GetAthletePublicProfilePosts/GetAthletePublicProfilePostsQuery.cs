using backend.Features.Posts.GetPosts;
using MediatR;

namespace backend.Features.Profiles.GetAthletePublicProfilePosts;

public record GetAthletePublicProfilePostsQuery(int PublicProfileId, string? CurrentUserId = null)
    : IRequest<List<GetPostResponse>>;
