"use client";
import { log } from "@/lib/logger";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Button from '@/components/ui/Button';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface RecipeReviewsProps {
  recipeSlug: string;
  isAuthor: boolean;
}

export default function RecipeReviews({ recipeSlug, isAuthor }: RecipeReviewsProps) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch(`/api/recipes/${recipeSlug}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
          setAverageRating(data.averageRating);
          setTotalReviews(data.totalReviews);

          if (user) {
            const userReview = data.reviews.find(
              (r: Review) => r.user.id === user.id
            );
            if (userReview) {
              setRating(userReview.rating);
              setComment(userReview.comment || "");
            }
          }
        }
      } catch (err) {
        log.error({ error: err instanceof Error ? { message: err.message } : String(err) }, "Failed to fetch reviews");
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [recipeSlug, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return (window.location.href = "/auth");

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      // Refresh reviews
      const reviewsResponse = await fetch(`/api/recipes/${recipeSlug}/reviews`);
      if (reviewsResponse.ok) {
        const data = await reviewsResponse.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }

      setShowReviewForm(false);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    const currentRating = interactive && hoveredRating > 0 ? hoveredRating : count;
    return (
      <div className="flex gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 28 : 18}
            className={`${
              star <= currentRating ? "fill-amber-400 text-amber-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="bg-bg-secondary rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      </div>
    );

  return (
    <div className="bg-bg-secondary rounded-lg shadow-md p-4 sm:p-6">
      {/* Header - Mobile First */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text mb-3">Reviews & Ratings</h2>
        
        {/* Rating Summary - Stacked on mobile, inline on larger screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-xl sm:text-2xl font-bold text-text">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm sm:text-base text-text-secondary">
              ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>

          {isAuthenticated && !isAuthor && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              variant="primary"
              className="w-full sm:w-auto"
            >
              {reviews.some((r) => r.user.id === user?.id) ? "Update Review" : "Write a Review"}
            </Button>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && isAuthenticated && !isAuthor && (
        <form onSubmit={handleSubmitReview} className="mb-6 p-3 sm:p-4 bg-bg rounded-lg border border-border">
          <h3 className="text-base sm:text-lg font-semibold text-text mb-4">Your Review</h3>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Rating *
            </label>
            {renderStars(rating, true)}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-border rounded-lg bg-bg-secondary text-text focus:ring-2 focus:ring-accent focus:border-transparent text-sm sm:text-base"
              rows={4}
              placeholder="Share your thoughts about this recipe..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={submitting} variant="primary" className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            <Button 
              type="button" 
              onClick={() => { setShowReviewForm(false); setError(null); }} 
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-text-secondary text-center py-8 text-sm sm:text-base">
            No reviews yet. Be the first to review this recipe!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar - Smaller on mobile */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={review.user.avatarUrl || "/img/users/default-avatar.png"}
                    alt={review.user.username}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 40px, 48px"
                  />
                </div>
                
                {/* Review Content - Flexible layout */}
                <div className="flex-1 min-w-0">
                  {/* User info and rating - Stack on small mobile, wrap on larger screens */}
                  <div className="flex flex-wrap items-start sm:items-center gap-2 mb-2">
                    <span className="font-semibold text-text text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                      {review.user.username}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(review.rating)}
                      <span className="text-xs sm:text-sm text-text-muted whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Comment - Allow text to wrap naturally */}
                  {review.comment && (
                    <p className="text-text text-sm sm:text-base break-words">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
