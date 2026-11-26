namespace backend.Features.DonationCampaigns.GetDonations;

public record GetDonationCampaignResponse(
    int CampaignId,
    int AthletePublicProfileId,
    string Title,
    string Content,
    decimal GoalAmount,
    decimal CurrentAmount,
    string? MediaUrl,
    string AthleteName,
    string? AthletePhotoUrl,
    int AthleteGender,
    DateTime CreatedAt,
    // Only filled by the campaign detail endpoint
    List<string>? MediaUrls = null,
    bool IsFollowing = false,
    bool IsOwnCampaign = false
);
