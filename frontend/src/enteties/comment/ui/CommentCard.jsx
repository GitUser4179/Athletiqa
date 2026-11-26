import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserActionsMenu } from "../../../features/block-user";
import { Avatar } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import { formatRelativeTime } from "../../../shared/lib/formatDate";

// Single comment row, avatar + name navigates to the author's profile.
// The ⋯ menu opens a block-user confirmation modal (via UserActionsMenu).
export function CommentCard({ comment, isAuthenticated = false }) {
  const navigate = useNavigate();
  const [isHidden, setIsHidden] = useState(false);

  // Anonymous authors (no type/id) have no profile to link to and can't be blocked
  const hasProfile = Boolean(comment.authorType && comment.authorPublicProfileId);

  const handleAuthorNavigate = () => {
    if (!hasProfile) return;
    navigate(`/${comment.authorType}-profile/${comment.authorPublicProfileId}`);
  };

  // Blocking the author hides their comment right away
  if (isHidden) return null;

  return (
    <article className="flex gap-3 pb-4 border-b border-gray-200 last:border-b-0">
      {/* Clickable avatar, navigates to the comment author's profile */}
      <Button
        variant="none"
        onClick={handleAuthorNavigate}
        className="!p-0 !rounded-none flex-shrink-0"
      >
        <Avatar
          src={comment.authorAvatar}
          alt={comment.authorName}
          size="xs"
          fallback={comment.authorFallback}
          className="!w-10 !h-10"
        />
      </Button>

      {/* Right column header row, name + date + ⋯ menu and yellow bubble */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Header row */}
        <header className="flex items-center gap-2">
          {/* Clickable author name, navigates to profile */}
          <Button
            variant="none"
            onClick={handleAuthorNavigate}
            className="!p-0 !rounded-none hover:underline"
          >
            <span className="font-semibold text-primary text-sm">
              {comment.authorName}
            </span>
          </Button>

          <time className="text-xs text-gray-500">
            {formatRelativeTime(comment.createdAt)}
          </time>

          {/* ⋯ menu (block / report) */}
          {hasProfile && (
            <UserActionsMenu
              user={{ type: comment.authorType, publicProfileId: comment.authorPublicProfileId, name: comment.authorName }}
              className="ml-auto"
              isAuthenticated={isAuthenticated}
              onBlocked={() => setIsHidden(true)}
            />
          )}
        </header>

        {/* Yellow comment bubble */}
        <div className="bg-accent-light rounded-xl px-4 py-3 text-sm text-gray-700">
          <p>{comment.content}</p>
        </div>
      </div>
    </article>
  );
}
