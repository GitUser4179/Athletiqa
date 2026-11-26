const API_BASE = import.meta.env.VITE_API_URL || '';

export async function createPost(payload) {
    
  // const token = localStorage.getItem('token'); // JWT token but we use cookies for authentication, so this is not needed. Kept here for reference in case we switch to token-based auth in the future.

  const response = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // We use cookies. If we switch to token-based auth, we would include the token in the Authorization header like this.
    },
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (response.status === 401) 
  {
    throw new Error("Session expired. Please log in again.");
  }

  if (response.status === 403)
  {
    throw new Error("Only athletes can create posts.");
  }
  
  if (!response.ok) 
  {
    // Try to get error details from backend validation if available
    
    throw new Error(data.message || `Failed to create post: ${response.status}`);
  }

  return data;
}