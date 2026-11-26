import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const API_BASE = import.meta.env.VITE_API_URL || '';

export function checkRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, currentUserId } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE}/api/users/me`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          setRole(null);
          return;
        }

        const data = await response.json();

        setRole(data.role);
      })
      .catch(() => {
        setRole(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated, currentUserId]);

  return {
    role,
    loading,
  };
}