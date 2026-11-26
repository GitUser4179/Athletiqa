import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import { HeartIcon, MessageIcon } from "../../../shared/assets";
import { formatRelativeTime } from "../../../shared/lib/formatDate";
import { useTranslation } from "react-i18next";
import { deletePost } from "../api/postApi";

// Compact card for the post grid, click image/title/message icon onOpen.
// `isOwnPost` adds a ⋯ menu in the corner with edit / delete shortcuts.
export function PostCard({
  post,
  onOpen,
  onToggleLike,
  onDeleted,
  isOwnPost = false,
  isAuthenticated = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Optimistic like state — heart fills instantly without waiting on the API
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);

  // Dropdown menu state for the own-post ⋯ button
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const videoRef = useRef(null);

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isMenuOpen]);

  // Early-return AFTER hooks so React's hook order stays stable
  if (!post || isDeleted) return null;

  // Use the first media item as the card preview
  const firstMedia = post.mediaContents?.[0];
  const mediaUrl = firstMedia?.mediaUrl;
  const isVideo = firstMedia?.resourceType?.toLowerCase() === "video";

  // Post information
  const title = post.title;
  const author = post.author ?? post.authorName;
  const commentsCount = post.commentsCount ?? post.comments ?? 0;
  const date = post.date ?? post.createdAt;
  const postId = post.postId ?? post.id;

  const goToEdit = () => navigate(`/post/${post.postId ?? post.id}/edit`, { state: { post } });

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!window.confirm(t("Vill du radera inlägget? Det går inte att ångra."))) return;
    setIsDeleting(true);
    try {
      await deletePost(postId);
      setIsDeleted(true);
      onDeleted?.(postId);
    } catch (err) {
      console.error(err);
      window.alert(t("Kunde inte radera inlägget, försök igen."));
    } finally {
      setIsDeleting(false);
    }
  };

  // Sends the user to the author's profile when they click the avatar + name
  const handleAuthorNavigate = (e) => {
    e.stopPropagation();
    navigate(`/athlete-profile/${post.athleteId ?? post.authorId ?? ""}`);
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

  const handleOpenComments = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    onOpen?.();
  };

  const handlePreviewStart = () => {
    if (!videoRef.current) return;

    videoRef.current.play().catch(() => {});
  };

  const handlePreviewStop = () => {
    if (!videoRef.current) return;

    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <article className="relative w-full min-h-0 p-4 rounded-xl border border-gray-300 bg-surface flex flex-col gap-4">
      {/* Owner only ... menu in the top-right corner */}
      {(isOwnPost || post.isOwnPost) && (
        <div className="absolute top-3 right-3 z-10" ref={menuRef}>
          <Button
            variant="none"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((open) => !open);
            }}
            className="!p-0 !rounded-full text-xl leading-none text-gray-700 hover:text-primary bg-transparent hover:bg-transparent w-8 h-8 rounded-full flex items-center justify-center"
          >
            ⋯
          </Button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-[10rem] bg-surface border border-gray-300 rounded-xl shadow-md py-1 z-10 overflow-hidden">
              <Button
                variant="menuItem"
                onClick={goToEdit}
                className="text-gray-700"
              >
                    {t("Redigera")}
              </Button>
              <Button
                variant="menuItem"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600"
              >
                    {t("Radera")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Image, opens the modal */}
      <Button
        variant="none"
        onClick={onOpen}
        onMouseEnter={handlePreviewStart}
        onMouseLeave={handlePreviewStop}
        className="!p-0 !rounded-lg w-full aspect-[242/254] overflow-hidden flex-shrink-0"
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full rounded-lg object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={mediaUrl}
            alt=""
            className="w-full h-full rounded-lg object-cover"
          />
        )}
      </Button>

      {/* Title + author + stats row */}
      <div className="flex flex-col gap-3">
        {/* Title, opens the modal */}
        <Button
          variant="none"
          onClick={onOpen}
          className="!p-0 !rounded-none text-left hover:underline w-fit"
        >
          <h3 className="text-lg font-bold text-primary leading-6 flex-shrink-0">
            {title}
          </h3>
        </Button>

        {/* Avatar + author name, navigates to author's profile */}
        <Button
          variant="none"
          onClick={handleAuthorNavigate}
          className="!p-0 !rounded-none flex items-center gap-2 hover:underline w-fit"
        >
          <Avatar
            src={post.authorAvatar}
            alt={author}
            size="xs"
            fallback={post.authorFallback}
          />
          <span className="text-sm text-gray-700">{author}</span>
        </Button>

        {/* Bottom row, like button, comment count, relative-time date */}
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div className="flex items-center gap-4">
            <Button
              variant="none"
              onClick={handleToggleLike}
              title={!isAuthenticated ? t("Logga in för att gilla") : undefined}
              className={`group !p-0 !rounded-none flex items-center gap-1 transition-colors ${
                liked ? "text-red-500" : "hover:text-red-500"
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
              title={!isAuthenticated ? t("Logga in för att kommentera") : undefined}
              className="group !p-0 !rounded-none flex items-center gap-1 hover:text-primary transition-colors"
            >
              <MessageIcon className="w-4 h-4" />
              {commentsCount}
            </Button>
          </div>
          <span className="text-gray-500">{formatRelativeTime(date)}</span>
        </div>
      </div>
    </article>
  );
}

/* Outdated component, saved in case it still needs to be used.
export function PostCard({ post, onToggleLike }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      async function loadComments() {
        setIsLoading(true);
        try {
          const data = await getComment(post.id);
          setComments(data);
        } catch (error) {
          console.error('Error fetching comments:', error);
        } finally {
          setIsLoading(false);
        }
      }
      loadComments();
    }
  }, [isModalOpen, post.id]);

  if (!post) {
    return null;
  }

  return (
    <>
      <article className="post-card" onClick={() => setIsModalOpen(true)}>
        <header className="post-card__header">
          <Avatar src={post.authorAvatar} alt={post.authorName} size="sm" />
          <div className="post-card__meta">
            <p className="post-card__author-name">{post.authorName}</p>
            <time className="post-card__date">{post.createdAt}</time>
          </div>
        </header>

        <h2 className="post-card__title">{post.title}</h2>
        <PostMedia imageUrl={post.media} />
      </article>
    </>
  );
}
*/
