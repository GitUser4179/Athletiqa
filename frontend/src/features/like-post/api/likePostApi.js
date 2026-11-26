const API_BASE = import.meta.env.VITE_API_URL || '';

// Sends a POST request to like a post and returns the updated like state.
export async function likePost(postId) {
  const response = await fetch(
    `${API_BASE}/api/posts/${postId}/like`,
    {
      method: "POST",

      credentials: "include",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to like post: ${response.status}`);
  }

  return data;
}
// Sends a DELETE request to unlike a post and returns the updated like state.
export async function unlikePost(postId) {
  const response = await fetch(
    `${API_BASE}/api/posts/${postId}/like`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to unlike post: ${response.status}`);
  }

  return data;
}
