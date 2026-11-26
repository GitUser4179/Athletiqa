namespace backend.Features.Posts.GetPosts;

public record GetPostResponse(
    int PostId,
    int AthletePublicProfileId,
    string Title,
    string Content,
	List<GetPostMediaResponse>? MediaContents,
    string AthleteName,
    string? AthleteAvatar,
    int AthleteGender,
    DateTime CreatedAt,
    int LikeCount = 0,
    int CommentCount = 0,
    bool IsLiked = false, // whether the current (logged in) user has liked the post
    bool IsFollowing = false // whether the current user follows the post's athlete
);
