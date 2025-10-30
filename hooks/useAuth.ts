// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

const USER_STORAGE_KEY = "cookbook-user-cache";

export function useAuth(serverUser?: User | null) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const hasInitialLoad = useRef(false); // Track if we've done initial load
  const router = useRouter();

  const loadUser = useCallback(async (showLoading = true) => {
    // Don't show loading on initial silent verification
    if (showLoading) setLoading(true);

    try {
      const res = await fetch("/api/auth");
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
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
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only do initial verification once, silently
    if (!hasInitialLoad.current) {
      hasInitialLoad.current = true;
      // Use requestIdleCallback to defer auth check until after paint
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        requestIdleCallback(() => loadUser(false));
      } else {
        setTimeout(() => loadUser(false), 100);
      }
    }
  }, [loadUser]);

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
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      return updatedUser;
    });
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: () => loadUser(true), // Explicit refresh shows loading
    updateUser,
  };
}
