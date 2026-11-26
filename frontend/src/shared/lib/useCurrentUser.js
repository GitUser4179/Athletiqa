import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, currentUserId } = useAuth();

  useEffect(() => {
    let ignore = false;

    // gets the logged in user from the auth cookie
    fetch(`${API_BASE}/api/users/me`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return response.json();
      })
      .then((user) => {
        if (!ignore) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, currentUserId]);

  return { currentUser, isLoading };
}
