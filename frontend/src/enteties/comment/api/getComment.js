const API_BASE = import.meta.env.VITE_API_URL || '';

import { mapCommentFromApi } from '../../../enteties/comment/';

export async function getComment(postId) {
    const response = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        credentials: "include",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) 
    {
        throw new Error(data.message || `Failed to fetch comments: ${response.status}`);
    }

    return data.map(dto => mapCommentFromApi(dto));
}