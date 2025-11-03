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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 28 : 20}
            className={`${
              star <= currentRating ? "fill-amber-400 text-amber-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer" : ""}`}
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
      <div className="bg-bg-secondary rounded-lg shadow-md p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      </div>
    );

  return (
    <div className="bg-bg-secondary rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">Reviews & Ratings</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-2xl font-bold text-text">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-text-secondary">
              ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        {isAuthenticated && !isAuthor && (
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="primary"
          >
            {reviews.some((r) => r.user.id === user?.id) ? "Update Review" : "Write a Review"}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && isAuthenticated && !isAuthor && (
        <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-bg rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-text mb-4">Your Review</h3>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error rounded-lg">
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
              className="w-full px-4 py-2 border border-border rounded-lg bg-bg-secondary text-text focus:ring-2 focus:ring-accent focus:border-transparent"
              rows={4}
              placeholder="Share your thoughts about this recipe..."
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} variant="primary">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            <Button type="button" onClick={() => { setShowReviewForm(false); setError(null); }} variant="secondary">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No reviews yet. Be the first to review this recipe!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-t border-border pt-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={review.user.avatarUrl || "/img/users/default-avatar.png"}
                    alt={review.user.username}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-text">{review.user.username}</span>
                    {renderStars(review.rating)}
                    <span className="text-sm text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {review.comment && <p className="text-text">{review.comment}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
