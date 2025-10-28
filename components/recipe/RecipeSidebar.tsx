"use client";

import { Star, ShoppingCart } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import SocialShare from "@/components/SocialShare";
import PrintButton from "@/components/PrintButton";

interface RecipeSidebarProps {
  recipeId: string;
  title: string;
  description?: string;
  averageRating: number;
  reviewCount: number;
  calories?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbsG?: number | null;
}

export default function RecipeSidebar({
  recipeId,
  title,
  description,
  averageRating,
  reviewCount,
  calories,
  proteinG,
  fatG,
  carbsG,
}: RecipeSidebarProps) {
  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating);
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={
              star <= roundedRating
                ? "fill-highlight text-highlight"
                : "text-border"
            }
          />
        ))}
      </div>
    );
  };

  const handlePrintIngredients = () => {
    // Create a printable view of just ingredients
    window.print();
  };

  const hasNutrition = calories || proteinG || fatG || carbsG;

  return (
    <div className="space-y-6">
      {/* Recipe Actions */}
      <div className="bg-bg-secondary rounded-lg shadow-md p-6 space-y-3">
        <h3 className="text-lg font-semibold text-text mb-4">Recipe Actions</h3>
        <FavoriteButton recipeId={recipeId} />
        <SocialShare title={title} description={description} />
        <PrintButton />
        <button
          onClick={handlePrintIngredients}
          className="w-full flex items-center gap-2 px-4 py-2 bg-bg text-text hover:bg-accent-light rounded-lg font-medium transition-colors print:hidden"
        >
          <ShoppingCart size={20} />
          Print Ingredients
        </button>
      </div>

      {/* Rating Section */}
      {(averageRating > 0 || reviewCount > 0) && (
        <div className="bg-bg-secondary rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Rating</h3>
          <div className="text-center">
            {renderStars(averageRating)}
            <div className="mt-2 text-2xl font-bold text-text">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Info */}
      {hasNutrition && (
        <div className="bg-bg-secondary rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text mb-4">
            Nutrition Per Serving
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {calories && (
              <div className="text-center p-3 bg-bg rounded-lg">
                <div className="text-2xl font-bold text-text">{calories}</div>
                <div className="text-xs text-text-secondary mt-1">Calories</div>
              </div>
            )}
            {proteinG && (
              <div className="text-center p-3 bg-bg rounded-lg">
                <div className="text-2xl font-bold text-text">{proteinG}g</div>
                <div className="text-xs text-text-secondary mt-1">Protein</div>
              </div>
            )}
            {fatG && (
              <div className="text-center p-3 bg-bg rounded-lg">
                <div className="text-2xl font-bold text-text">{fatG}g</div>
                <div className="text-xs text-text-secondary mt-1">Fat</div>
              </div>
            )}
            {carbsG && (
              <div className="text-center p-3 bg-bg rounded-lg">
                <div className="text-2xl font-bold text-text">{carbsG}g</div>
                <div className="text-xs text-text-secondary mt-1">Carbs</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
