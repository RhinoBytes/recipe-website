// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

const USER_STORAGE_KEY = "cookbook-user-cache";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Load cached user from localStorage to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(USER_STORAGE_KEY);
        if (cached) {
          const cachedUser = JSON.parse(cached);
          setUser(cachedUser);
        }
      } catch (error) {
        console.error("Error loading cached user:", error);
      }
      setMounted(true);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadUser();
    }
  }, [mounted, loadUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      return updatedUser;
    });
  }, []);

  return {
    user,
    loading: !mounted || loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: loadUser,
    updateUser,
  };
}
