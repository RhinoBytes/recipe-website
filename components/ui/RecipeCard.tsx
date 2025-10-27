import Link from "next/link";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import type { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  priority?: boolean;
}

export default function RecipeCard({ recipe, priority = false }: RecipeCardProps) {
  // Use author username if available, fallback to id
  const recipeUrl = recipe.author.username 
    ? `/recipes/${recipe.author.username}/${recipe.id}`
    : `/recipes/${recipe.id}`;
    
  return (
    <Link
      href={recipeUrl}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
    >
      <div className="relative w-full h-48">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
          priority={priority}
        />
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-[#d4735a] transition">
          {recipe.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#d4735a] text-white flex items-center justify-center font-bold text-xs">
              {recipe.author.avatar}
            </div>
            <span>{recipe.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center text-yellow-400">
              {[...Array(recipe.rating)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
              {[...Array(5 - recipe.rating)].map((_, i) => (
                <Star key={i} size={16} className="text-gray-300" />
              ))}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {recipe.time} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}