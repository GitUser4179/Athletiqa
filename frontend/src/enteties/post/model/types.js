// This file contains the mapping function that transforms raw post data from the API into a clean format for the frontend.
export function mapPostFromApi(dto) {
  return {
    id: dto.postId,
    athleteId: dto.athletePublicProfileId ?? dto.athleteId,
    title: dto.title || "Untitled Post",
    content: dto.content || "No description yet.",
    createdAt: new Date(dto.createdAt).toLocaleString("sv-SE"),
    mediaContents: dto.mediaContents ?? [],
    media: dto.mediaContents?.[0]?.mediaUrl ?? null,
    authorName: dto.athleteName || "Unknown User",
    authorAvatar: dto.athleteAvatar || null,
    authorFallback: dto.athleteGender,
    likes: Number(dto.likeCount || 0),
    comments: Number(dto.commentCount || 0),
    isLiked: Boolean(dto.isLiked),
    isFollowing: Boolean(dto.isFollowing),
  };
}
