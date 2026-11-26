export function mapCommentFromApi(dto) {
  return {
    id: dto.id,
    authorName: dto.authorName,
    authorAvatar: dto.authorAvatar,
    authorFallback: dto.authorFallback,
    content: dto.content,
    // null for anonymous authors (and the user's own just-posted comment)
    authorType: dto.authorType ?? null,
    authorPublicProfileId: dto.authorPublicProfileId ?? null,
    createdAt: new Date(dto.createdAt).toLocaleString('sv-SE'),
  };
}
