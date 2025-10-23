import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Strategy: Get the highest-rated recipe with at least 5 reviews
    const featuredRecipes = await prisma.recipe.findMany({
      where: {
        isPublished: true,
        reviews: {
          some: {},
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Get top 10 recent recipes to find one with good ratings
    });

    // Calculate average rating and find best candidate for featured
    let featuredRecipe = null;
    let highestScore = 0;

    for (const recipe of featuredRecipes) {
      if (recipe._count.reviews < 2) continue; // Skip recipes with fewer than 2 reviews

      const totalRating = recipe.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating = totalRating / recipe._count.reviews;
      // Score based on rating and number of reviews
      const score = avgRating * Math.min(recipe._count.reviews / 5, 1);

      if (score > highestScore) {
        highestScore = score;
        featuredRecipe = {
          id: recipe.id,
          title: recipe.title,
          description:
            recipe.description ||
            "This delicious recipe has been featured based on excellent reviews from our community.",
          image: recipe.imageUrl || "/images/recipes/default.jpg",
        };
      }
    }

    // If no suitable recipe was found, just use the most recent one
    if (!featuredRecipe && featuredRecipes.length > 0) {
      featuredRecipe = {
        id: featuredRecipes[0].id,
        title: featuredRecipes[0].title,
        description:
          featuredRecipes[0].description ||
          "Check out this recently added recipe from our community!",
        image: featuredRecipes[0].imageUrl || "/images/recipes/default.jpg",
      };
    }

    return NextResponse.json({ recipe: featuredRecipe });
  } catch (error) {
    console.error("Failed to fetch featured recipe:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured recipe" },
      { status: 500 }
    );
  }
}
