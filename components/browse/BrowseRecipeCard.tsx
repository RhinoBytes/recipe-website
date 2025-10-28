"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Users, Heart } from "lucide-react";
import { useState } from "react";

interface BrowseRecipeCardProps {
  recipe: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    image: string;
    time: number;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number | null;
    difficulty: string | null;
    rating: number;
    reviewCount: number;
    author: {
      id: string;
      name: string;
      avatar: string;
      username?: string;
    };
    tags: string[];
    categories: string[];
    cuisine: string | null;
  };
  onFavoriteToggle?: (recipeId: string) => void;
  isFavorited?: boolean;
}

export default function BrowseRecipeCard({ 
  recipe, 
  onFavoriteToggle,
  isFavorited = false 
}: BrowseRecipeCardProps) {
  const [localFavorited, setLocalFavorited] = useState(isFavorited);
  const recipeUrl = recipe.author.username 
    ? `/recipes/${recipe.author.username}/${recipe.slug}`
    : `/recipes/${recipe.slug}`;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLocalFavorited(!localFavorited);
    if (onFavoriteToggle) {
      onFavoriteToggle(recipe.id);
    }
  };

  return (
    <Link
      href={recipeUrl}
      className="group bg-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full border border-border"
    >
      {/* Image */}
      <div className="relative w-full h-56 overflow-hidden">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all z-10 ${
            localFavorited 
              ? "bg-secondary text-bg" 
              : "bg-bg-secondary/80 text-text-secondary hover:bg-bg-secondary hover:text-secondary"
          }`}
          aria-label={localFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            size={18} 
            className={localFavorited ? "fill-current" : ""} 
          />
        </button>

        {/* Difficulty Badge */}
        {recipe.difficulty && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-bg-secondary/90 backdrop-blur-sm text-text border border-border">
            {recipe.difficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold font-heading text-lg mb-2 text-text group-hover:text-accent transition line-clamp-2">
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2 flex-1">
            {recipe.description}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-hover text-bg flex items-center justify-center font-bold text-xs overflow-hidden">
            {recipe.author.avatar.startsWith('http') ? (
              <Image src={recipe.author.avatar} alt={recipe.author.name} fill className="object-cover" />
            ) : (
              recipe.author.avatar.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm text-text-secondary">{recipe.author.name}</span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-text-secondary mb-3 gap-2">
          <div className="flex items-center gap-3">
            {recipe.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} fill="currentColor" className="text-highlight" />
                <span className="text-xs font-medium">{recipe.rating.toFixed(1)}</span>
                {recipe.reviewCount > 0 && (
                  <span className="text-xs text-text-muted">({recipe.reviewCount})</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={14} />
              <span className="text-xs">{recipe.time} min</span>
            </span>
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                <span className="text-xs">{recipe.servings}</span>
              </span>
            )}
          </div>
        </div>

        {/* Cuisine and Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {recipe.cuisine && (
            <span className="px-2 py-1 bg-accent-light text-accent rounded-lg text-xs font-medium">
              {recipe.cuisine}
            </span>
          )}
          {recipe.tags.slice(0, 2).map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-1 bg-secondary-light text-text-secondary rounded-lg text-xs"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 2 && (
            <span className="px-2 py-1 bg-border text-text-muted rounded-lg text-xs">
              +{recipe.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
