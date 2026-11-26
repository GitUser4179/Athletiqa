using MediatR;

namespace backend.Features.Profiles.GetSponsorPublicProfile;

public record GetSponsorPublicProfileQuery(int PublicProfileId, string? CurrentUserId = null)
    : IRequest<GetSponsorPublicProfileResponse?>;
