"use client";

import { Star } from "lucide-react";
import FavoriteButton from '@/components/recipe/FavoriteButton';
import SocialShare from '@/components/recipe/SocialShare';
import PrintButton from '@/components/recipe/PrintButton';

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
      <div className="flex gap-1 justify-center">
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

  const hasNutrition = calories || proteinG || fatG || carbsG;

  return (
    <div className="space-y-6">
      {/* Recipe Actions - 2x2 Grid */}
      <div className="bg-bg-secondary rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FavoriteButton recipeId={recipeId} />
          </div>
          <SocialShare title={title} description={description} />
          <PrintButton />
        </div>
      </div>

      {/* Rating Section */}
      {(averageRating > 0 || reviewCount > 0) && (
        <div className="bg-bg-secondary rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Rating</h3>
          <div className="text-center space-y-3">
            {renderStars(averageRating)}
            <div className="text-3xl font-bold text-text">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-text-secondary">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Info - Enhanced Styling */}
      {hasNutrition ? (
        <div className="bg-gradient-to-br from-accent-light to-secondary-light rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text mb-4 text-center">
            Nutrition Per Serving
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {calories && (
              <div className="bg-bg-secondary rounded-lg p-4 text-center border-2 border-accent/20 hover:border-accent/40 transition-colors">
                <div className="text-3xl font-bold text-accent">{calories}</div>
                <div className="text-xs text-text-secondary mt-1 font-medium">Calories</div>
              </div>
            )}
            {proteinG && (
              <div className="bg-bg-secondary rounded-lg p-4 text-center border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
                <div className="text-3xl font-bold text-secondary">{proteinG}g</div>
                <div className="text-xs text-text-secondary mt-1 font-medium">Protein</div>
              </div>
            )}
            {fatG && (
              <div className="bg-bg-secondary rounded-lg p-4 text-center border-2 border-muted/20 hover:border-muted/40 transition-colors">
                <div className="text-3xl font-bold text-muted">{fatG}g</div>
                <div className="text-xs text-text-secondary mt-1 font-medium">Fat</div>
              </div>
            )}
            {carbsG && (
              <div className="bg-bg-secondary rounded-lg p-4 text-center border-2 border-highlight/20 hover:border-highlight/40 transition-colors">
                <div className="text-3xl font-bold text-highlight">{carbsG}g</div>
                <div className="text-xs text-text-secondary mt-1 font-medium">Carbs</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg shadow-md p-6 text-center border-2 border-border/50">
          <h3 className="text-lg font-semibold text-text mb-2">
            Nutrition Information
          </h3>
          <p className="text-sm text-text-secondary">
            Not Available
          </p>
          <p className="text-xs text-text-muted mt-2">
            Nutritional data has not been provided for this recipe
          </p>
        </div>
      )}
    </div>
  );
}
