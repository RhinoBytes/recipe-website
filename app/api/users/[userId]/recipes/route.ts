import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: userId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            username: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            reviews: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedRecipes = recipes.map((recipe) => {
      const totalRating = recipe.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        recipe.reviews.length > 0 ? totalRating / recipe.reviews.length : 0;

      return {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes || 0,
        cookTimeMinutes: recipe.cookTimeMinutes || 0,
        servings: recipe.servings,
        status: recipe.status,
        rating: Math.round(averageRating),
        reviewCount: recipe._count.reviews,
        favoriteCount: recipe._count.favorites,
        tags: recipe.tags.map((t) => t.tag.name),
        categories: recipe.categories.map((c) => c.category.name),
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString(),
        author: recipe.author,
      };
    });

    return NextResponse.json({ recipes: formattedRecipes });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
