import { mapPostFromApi } from "../model/types";

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function listPosts(athleteId, search) {
    const params = new URLSearchParams();

    if (athleteId) {
        params.set("athleteId", athleteId);
    }
    if (search) {
        params.set("search", search);
    }
    const query = params.toString();

    const response = await fetch(`${API_BASE}/api/posts${query ? `?${query}` : ""}`, {
    credentials: "include",
  	});

    const data = await response.json().catch(() => ([]));

    if (!response.ok) {
        throw new Error(data.message || `Failed to fetch posts: ${response.status}`);
    }

    return data.map(postDto => mapPostFromApi(postDto));
}

export async function listMyPosts() {
    const response = await fetch(`${API_BASE}/api/users/me/posts`, {
        credentials: "include",
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
        throw new Error(data.message || `Failed to fetch profile posts: ${response.status}`);
    }

    return data.map((postDto) => mapPostFromApi(postDto));
}
// Deletes one of the current user's own posts
export async function deletePost(postId) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
    }
}
