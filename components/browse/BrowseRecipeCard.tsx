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
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
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
              ? "bg-red-500 text-white" 
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
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
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800">
            {recipe.difficulty}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition line-clamp-2">
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 flex-1">
            {recipe.description}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
            {recipe.author.avatar.startsWith('http') ? (
              <Image src={recipe.author.avatar} alt={recipe.author.name} fill className="object-cover" />
            ) : (
              recipe.author.avatar.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{recipe.author.name}</span>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3 gap-2">
          <div className="flex items-center gap-3">
            {recipe.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} fill="currentColor" className="text-amber-500" />
                <span className="text-xs font-medium">{recipe.rating.toFixed(1)}</span>
                {recipe.reviewCount > 0 && (
                  <span className="text-xs text-gray-500">({recipe.reviewCount})</span>
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
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md text-xs font-medium">
              {recipe.cuisine}
            </span>
          )}
          {recipe.tags.slice(0, 2).map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs">
              +{recipe.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
