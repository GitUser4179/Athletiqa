using MediatR;

namespace backend.Features.Profiles.GetAthletePublicProfile;

public record GetAthletePublicProfileQuery(int PublicProfileId, string? CurrentUserId = null)
    : IRequest<GetAthletePublicProfileResponse?>;
