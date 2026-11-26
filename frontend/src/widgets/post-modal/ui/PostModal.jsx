import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateCommentForm } from "../../../features/create-comment";
import { CommentCard, getComment } from "../../../enteties/comment";
import { FollowButton } from "../../../features/follow-athlete";
import { Modal } from "../../../shared/ui/modal";
import { Avatar } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import { Chip } from "../../../shared/ui/chip";
import {
  HeartIcon,
  MessageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PenIcon,
} from "../../../shared/assets";
import { formatRelativeTime } from "../../../shared/lib/formatDate";
import { useTranslation } from "react-i18next";

export function PostModal({
  post,
  isOpen,
  onClose,
  onToggleLike,
  isOwnPost = false,
  isAuthenticated = false,
}) {
  const navigate = useNavigate();

  // Which view shows in the right pane — "default" (post details) or "comments"
  const [view, setView] = useState("default");

  // Comments are loaded lazily when the modal opens
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Optimistic like state. Local copy so the heart fills instantly on click.
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);

  // The modal stays mounted while different posts are opened, so re-sync the like state per post
  useEffect(() => {
    setLiked(post?.isLiked ?? false);
    setLikeCount(post?.likes ?? 0);
  }, [post?.id, post?.postId]);

  // Media carousel index
  const media = post?.mediaContents ?? [];
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Accept both backend (postId) and mock (id) shapes
  const postId = post?.postId ?? post?.id;

  // Sends the user to the author's profile when they click the avatar + name
  const handleAuthorNavigate = (e) => {
    e.stopPropagation();
    navigate(`/athlete-profile/${post?.athleteId ?? post?.authorId ?? ""}`, { state: { post } });
  };

  // Flip the heart locally, then fire the parent callback that hits the API
  const handleToggleLike = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikeCount((c) => c + (prevLiked ? -1 : 1));
    onToggleLike?.(postId, prevLiked);
  };

  const handleOpenComments = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setView("comments");
  };

  const { t } = useTranslation();

  // Load the post's comments from the API when the modal opens
  useEffect(() => {
    if (!isOpen || !postId) return;
    let cancelled = false;
    setIsLoading(true);
    getComment(postId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => console.error("Error fetching comments:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  // Reset to the default view whenever the modal closes
  useEffect(() => {
    if (!isOpen) setView("default");
  }, [isOpen]);

  if (!post) return null;

  const currentMedia = media[currentMediaIndex];
  const currentMediaUrl = currentMedia?.mediaUrl;
  const isCurrentMediaVideo =
    currentMedia?.resourceType?.toLowerCase() === "video";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[65rem] !h-[35rem] !overflow-hidden"
    >
      <div className="flex p-5 h-full">
        {/* Media section: image + carousel arrows + dots */}
        <div className="w-1/2 aspect-[242/254] bg-gray-100 relative flex-shrink-0 rounded-xl overflow-hidden self-start">
          {isCurrentMediaVideo ? (
            <video
              src={currentMediaUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={currentMediaUrl}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          )}

          {/* Previous media */}
          <Button
            variant="none"
            onClick={() => setCurrentMediaIndex((i) => Math.max(0, i - 1))}
            disabled={currentMediaIndex === 0}
            className="absolute left-4 bottom-1 -translate-y-1/2 !w-10 !h-10 !p-0 !rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeftIcon className="w-5 h-5 text-primary" />
          </Button>

          {/* Next media */}
          <Button
            variant="none"
            onClick={() =>
              setCurrentMediaIndex((i) => Math.min(media.length - 1, i + 1))
            }
            disabled={currentMediaIndex === media.length - 1}
            className="absolute right-4 bottom-1 -translate-y-1/2 !w-10 !h-10 !p-0 !rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ChevronRightIcon className="w-5 h-5 text-primary" />
          </Button>

          {/* Media indicator dots, only show if multiple media items */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {media.map((m, i) => (
                <span
                  key={m.mediaContentId ?? i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentMediaIndex ? "bg-primary" : "bg-gray-300"
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content section — switches between default and comments view */}
        {view === "default" ? (
          <div className="w-1/2 px-5 flex flex-col gap-5">
            {/* Header with clickable author + edit or follow action */}
            <header className="flex items-center gap-3">
              <Button
                variant="none"
                onClick={handleAuthorNavigate}
                className="!p-0 !rounded-none flex items-center gap-3 hover:underline"
              >
                <Avatar
                  src={post.authorAvatar}
                  alt={post.authorName}
                  size="s"
                  fallback={post.authorFallback}
                />
                <span className="text-base text-gray-700">
                  {post.authorName ?? post.author}
                </span>
              </Button>

              {isOwnPost ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/post/${post.postId ?? post.id}/edit`);
                  }}
                  className="px-4 py-1 rounded-xl font-medium flex items-center gap-1"
                >
                  <PenIcon className="w-3 h-3" />
                  {t("Redigera")}
                </Button>
              ) : (
                <FollowButton
                  athleteId={post?.athleteId}
                  initialIsFollowing={post?.isFollowing}
                  isAuthenticated={isAuthenticated}
                />
              )}
            </header>

            {/* Post title + body */}
            <h3 className="text-2xl font-bold text-primary leading-8">
              {post.title}
            </h3>
            <p className="text-base text-gray-700 leading-6">{post.content}</p>

            {post.sport && (
              <div>
                <Chip>{post.sport}</Chip>
              </div>
            )}

            {/* Stats row, like + comment count + date */}
            <div className="mt-auto flex items-center justify-between text-sm text-gray-700">
              <div className="flex items-center gap-4">
                <Button
                  variant="none"
                  onClick={handleToggleLike}
                  title={
                    !isAuthenticated ? t("Logga in för att gilla") : undefined
                  }
                  className={`group !p-0 !rounded-none flex items-center gap-1 transition-colors ${liked ? "text-red-500" : "hover:text-red-500"
                    }`}
                >
                  <HeartIcon
                    className={`w-4 h-4 transition-colors ${liked ? "fill-current" : "group-hover:fill-current"
                      }`}
                  />
                  {likeCount}
                </Button>

                <Button
                  variant="none"
                  onClick={handleOpenComments}
                  title={
                    !isAuthenticated ? t("Logga in för att kommentera") : undefined
                  }
                  className="!p-0 !rounded-none flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <MessageIcon className="w-4 h-4" />
                  {comments.length}
                </Button>
              </div>
              <span className="text-gray-500">
                {formatRelativeTime(post.createdAt ?? post.date)}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-1/2 px-5 flex flex-col gap-4">
            {/* Comments view header with back arrow + post author + count */}
            <header className="flex items-center gap-3 pb-3 border-b border-gray-300">
              <Button
                variant="none"
                onClick={() => setView("default")}
                className="!p-0 !rounded-none hover:text-primary transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
                <span className="flex-1 text-center text-base text-gray-700">
                {post.authorName ?? post.author}
                <span className="text-gray-400"> | </span>
                {t("Kommentarer")} ({comments.length})
              </span>
            </header>

            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 scrollbar-themed pr-3 gap-5">
              {isLoading ? (
                <p className="text-sm text-gray-500">{t("Laddar kommentarer...")}</p>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    isAuthenticated={isAuthenticated}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">{t("Inga kommentarer än.")}</p>
              )}
            </div>

            {/* Only logged in users can write comments. */}
            {isAuthenticated ? (
              <div className="pt-3 border-t border-gray-300">
                <CreateCommentForm
                  postId={postId}
                  onCommentCreated={(newComment) => {
                    setComments((prev) => [newComment, ...prev]);
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
