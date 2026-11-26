const API_BASE = import.meta.env.VITE_API_URL || '';

// Fetches messages for a specific user
export async function getMessage(conversationId) {
  const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data = await response.json();
  return data.messages;
}

// Fetches the list of conversations for the current user
export async function getConversations() {
  const response = await fetch(`${API_BASE}/api/conversations`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  const data = await response.json();
  return data.conversations;
}

// Opens (or creates) the conversation with another user, identified by their public profile.
// type: "athlete" | "sponsor"
export async function startConversation(type, publicProfileId) {
  const response = await fetch(`${API_BASE}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ type, publicProfileId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Failed to start conversation: ${response.status}`);
  }

  return data;
}
