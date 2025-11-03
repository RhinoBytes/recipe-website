"use client";
import { log } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FavoriteButtonProps {
  recipeId: string;
}

export default function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (isAuthenticated) {
        try {
          const response = await fetch("/api/favorites");
          if (response.ok) {
            const data = await response.json();
            const favorited = data.favorites.some(
              (fav: { id: string }) => fav.id === recipeId
            );
            setIsFavorited(favorited);
          }
        } catch (error) {
          log.error({ error: error instanceof Error ? { message: error.message } : String(error) }, "Failed to check favorite status");
        }
      }
      setInitialLoading(false);
    }
    
    fetchStatus();
  }, [recipeId, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/auth";
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?recipeId=${recipeId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
        
        if (response.ok) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      log.error({ error: error instanceof Error ? { message: error.message } : String(error) }, "Failed to toggle favorite");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-border text-text-muted rounded-lg cursor-not-allowed"
        aria-label="Loading favorite status"
      >
        <Loader2 className="animate-spin" size={20} />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
        isFavorited
          ? "bg-secondary text-bg hover:bg-secondary-hover"
          : "bg-bg-secondary text-text hover:bg-accent-light border-2 border-border"
      }`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          <span className="hidden sm:inline">Loading...</span>
        </>
      ) : (
        <>
          <Heart
            size={20}
            className={isFavorited ? "fill-current" : ""}
          />
          <span className="hidden sm:inline">{isFavorited ? "Favorited" : "Favorite"}</span>
        </>
      )}
    </button>
  );
}
