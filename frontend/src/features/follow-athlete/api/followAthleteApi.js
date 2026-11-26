const API_BASE = import.meta.env.VITE_API_URL || '';

// athleteId = the athlete's public profile id
async function sendFollow(athleteId, method) {
  const response = await fetch(`${API_BASE}/api/athletes/${athleteId}/follow`, {
    method,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to update follow: ${response.status}`);
  }

  return { athleteId, ...data }; // { isFollowing, followerCount }
}

export function followAthlete(athleteId) {
  return sendFollow(athleteId, "POST");
}

export function unfollowAthlete(athleteId) {
  return sendFollow(athleteId, "DELETE");
}

// Follower / following counts for the logged in user's own profile
export async function getMyFollowStats() {
  const response = await fetch(`${API_BASE}/api/users/me/follow-stats`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to load follow stats: ${response.status}`);
  }
  return response.json(); // { followers, following }
}
