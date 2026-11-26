namespace backend.Features.Posts.GetComments;

public record GetCommentResponse(
    int Id,
    string AuthorName,
    string? AuthorAvatar,
    string AuthorFallback,
    string Content,
    DateTime CreatedAt,
    string? AuthorType = null,          // "athlete" | "sponsor", null when the author is anonymous
    int? AuthorPublicProfileId = null   // used for the profile link and for blocking
);
