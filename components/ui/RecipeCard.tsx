import Link from "next/link";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import type { Recipe } from "@/types";
import { useRecipePlaceholder, useProfileAvatar } from "@/hooks/useCottagecorePlaceholders";

interface RecipeCardProps {
  recipe: Recipe;
  priority?: boolean;
}

export default function RecipeCard({ recipe, priority = false }: RecipeCardProps) {
  // Use author username if available, fallback to id
  const recipeUrl = recipe.author.username 
    ? `/recipes/${recipe.author.username}/${recipe.id}`
    : `/recipes/${recipe.id}`;
  
  // Use cottagecore placeholders for missing images
  const recipeImage = useRecipePlaceholder(recipe.image);
  const authorAvatar = useProfileAvatar(recipe.author.avatar);
    
  return (
    <Link
      href={recipeUrl}
      className="bg-bg-secondary rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition group border border-border"
    >
      <div className="relative w-full h-48">
        <Image
          src={recipeImage}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
          priority={priority}
          unoptimized={recipeImage.startsWith('data:')}
        />
      </div>
      <div className="p-6">
        <h3 className="font-semibold font-heading text-lg mb-2 text-text group-hover:text-accent transition">
          {recipe.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative rounded-full overflow-hidden border border-border">
  <Image
    src={authorAvatar}
    alt={recipe.author.name}
    fill
    className="object-cover"
    sizes="24px"
    unoptimized={authorAvatar.startsWith('data:')}
  />
</div>
            <span>{recipe.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center text-highlight">
              {[...Array(recipe.rating)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
              {[...Array(5 - recipe.rating)].map((_, i) => (
                <Star key={i} size={16} className="text-border" />
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