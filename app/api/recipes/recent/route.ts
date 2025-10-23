import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recentRecipes = await prisma.recipe.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        authorId: true,
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // Calculate average rating for each recipe
    const formattedRecipes = recentRecipes.map((recipe) => {
      const totalRating = recipe.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        recipe.reviews.length > 0
          ? Math.round(totalRating / recipe.reviews.length)
          : 0;

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.imageUrl || "/images/recipes/default.jpg",
        time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
        rating: averageRating,
        author: {
          name: recipe.author.username,
          avatar: recipe.author.avatarUrl
            ? recipe.author.avatarUrl.charAt(0)
            : recipe.author.username.charAt(0),
        },
      };
    });

    return NextResponse.json({ recipes: formattedRecipes });
  } catch (error) {
    console.error("Failed to fetch recent recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent recipes" },
      { status: 500 }
    );
  }
}
