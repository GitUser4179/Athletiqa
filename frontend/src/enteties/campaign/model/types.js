export function mapCampaignFromApi(dto) {
  return {
    campaignId: String(dto.campaignId),
    athleteId: dto.athletePublicProfileId ?? dto.athleteId,
    title: dto.title,
    content: dto.content,
    athleteName: dto.athleteName,
    goalAmount: Number(dto.goalAmount),
    currentAmount: Number(dto.currentAmount),
    mediaUrl: dto.mediaUrl || "https://placehold.co/1200x630?text=Campaign",
    sport: dto.sport || "Not specified",
    athletePhotoUrl: dto.athletePhotoUrl,
    athleteGender: dto.athleteGender,
    createdAt: dto.createdAt || null,
    mediaUrls: dto.mediaUrls ?? [],
    isFollowing: Boolean(dto.isFollowing),
    isOwnCampaign: Boolean(dto.isOwnCampaign),
  };
}
