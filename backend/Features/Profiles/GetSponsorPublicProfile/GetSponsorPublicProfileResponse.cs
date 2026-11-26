namespace backend.Features.Profiles.GetSponsorPublicProfile;

public record GetSponsorPublicProfileResponse(
    int PublicProfileId,
    string Name,
    string? Description,
    string? PhotoUrl,
    bool IsOwnProfile = false
);
