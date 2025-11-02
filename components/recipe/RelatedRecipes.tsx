import Image from "next/image";
import Link from "next/link";
import { Clock, Star, Heart } from "lucide-react";
import { DEFAULT_RECIPE_IMAGE } from "@/lib/constants";

interface RelatedRecipe {
  id: string;
  title: string;
  slug: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: string | null;
  averageRating: number;
  media: Array<{
    url: string;
    secureUrl: string | null;
    isPrimary: boolean;
  }>;
  author: {
    username: string;
  };
}

interface RelatedRecipesProps {
  recipes: RelatedRecipe[];
}

export default function RelatedRecipes({ recipes }: RelatedRecipesProps) {
  if (recipes.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart className="text-red-500" size={28} />
        You Might Also Like
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
          const totalTime =
            (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
          const roundedRating = Math.round(recipe.averageRating);
          
          // Extract primary image URL
          const primaryMedia = recipe.media.find(m => m.isPrimary) || recipe.media[0];
          const imageUrl = primaryMedia?.secureUrl || primaryMedia?.url || DEFAULT_RECIPE_IMAGE;

          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.author.username}/${recipe.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full h-40">
                <Image
                  src={imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {recipe.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{totalTime} min</span>
                    </div>
                  )}
                  {recipe.difficulty && (
                    <span className="capitalize">{recipe.difficulty.toLowerCase()}</span>
                  )}
                  {roundedRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{recipe.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
