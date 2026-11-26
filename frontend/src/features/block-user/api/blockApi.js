const API_BASE = import.meta.env.VITE_API_URL || '';

// Users are referenced by their public profile: type "athlete" | "sponsor" + publicProfileId

export async function blockUser(type, publicProfileId) {
  const response = await fetch(`${API_BASE}/api/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ type, publicProfileId }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to block user: ${response.status}`);
  }
}

export async function unblockUser(type, publicProfileId) {
  const response = await fetch(`${API_BASE}/api/blocks/${type}/${publicProfileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to unblock user: ${response.status}`);
  }
}

// [{ type, publicProfileId, name, photoUrl }]
export async function getBlockedUsers() {
  const response = await fetch(`${API_BASE}/api/users/me/blocks`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Failed to load blocked users: ${response.status}`);
  }
  return response.json();
}
