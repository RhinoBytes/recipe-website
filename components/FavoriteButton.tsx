"use client";

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
          console.error("Failed to check favorite status:", error);
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
      console.error("Failed to toggle favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg"
      >
        <Loader2 className="animate-spin" size={20} />
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isFavorited
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <Heart
          size={20}
          className={isFavorited ? "fill-current" : ""}
        />
      )}
      {isFavorited ? "Favorited" : "Add to Favorites"}
    </button>
  );
}
