import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/recipes/[slug]/reviews
 * Get all reviews for a recipe
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find recipe by slug
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Get reviews with user information
    const reviews = await prisma.review.findMany({
      where: { recipeId: recipe.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          username: review.user.username,
          avatarUrl: review.user.avatarUrl,
        },
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes/[slug]/reviews
 * Create a new review for a recipe
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Find recipe by slug
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, authorId: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Don't allow users to review their own recipes
    if (recipe.authorId === currentUser.userId) {
      return NextResponse.json(
        { error: "You cannot review your own recipe" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this recipe
    const existingReview = await prisma.review.findFirst({
      where: {
        recipeId: recipe.id,
        userId: currentUser.userId,
      },
    });

    if (existingReview) {
      // Update existing review
      const updatedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment || null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return NextResponse.json({
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
        user: {
          id: updatedReview.user.id,
          username: updatedReview.user.username,
          avatarUrl: updatedReview.user.avatarUrl,
        },
      });
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        recipeId: recipe.id,
        userId: currentUser.userId,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          username: review.user.username,
          avatarUrl: review.user.avatarUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
