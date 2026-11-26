import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import { PlusIcon, CheckCircleIcon } from "../../../shared/assets";
import { useFollowAthlete } from "../model/useFollowAthlete";

// Follow button, sends guests to login before they can follow anyone.
export function FollowButton({
  athleteId,
  initialIsFollowing = false,
  className = "",
  isAuthenticated = false,
}) {
  const navigate = useNavigate();

  // Local follow state, kept in sync with the API result.
  const [following, setFollowing] = useState(initialIsFollowing);

  // Profile/post data may arrive after the first render, keep in sync with it
  useEffect(() => {
    setFollowing(Boolean(initialIsFollowing));
  }, [initialIsFollowing, athleteId]);

  // Hook handles the actual API call + loading state.
  const { handleToggleFollow, isLoading } = useFollowAthlete();

  // Flip locally first, then revert if the API call fails.
  const handleClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!athleteId) return;

    const prev = following;
    setFollowing(!prev);
    handleToggleFollow(athleteId, prev).catch(() => {
      setFollowing(prev);
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      title={!isAuthenticated ? "Logga in för att följa" : undefined}
      className={`px-4 py-1 rounded-xl font-medium flex items-center gap-1 ${className}`}
    >
      {following ? "Följer" : "Följ"}
      {following ? (
        <CheckCircleIcon className="w-3 h-3" />
      ) : (
        <PlusIcon className="w-3 h-3" />
      )}
    </Button>
  );
}
