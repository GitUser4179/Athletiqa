namespace backend.Features.Profiles.GetAthletePublicProfile;

public record GetAthletePublicProfileResponse(
    int PublicProfileId,
    string Name,
    string? Bio,
    string? PhotoUrl,
    int Gender,
    IReadOnlyList<string> Sports,
    int FollowerCount = 0,
    bool IsFollowing = false,
    bool IsOwnProfile = false
);