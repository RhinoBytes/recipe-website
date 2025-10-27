import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/user/recipes
 * Get all recipes created by the currently authenticated user
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    const skip = (page - 1) * perPage;

    // Get total count for pagination
    const totalCount = await prisma.recipe.count({
      where: { authorId: currentUser.userId },
    });

    // Get user's recipes with pagination
    const recipes = await prisma.recipe.findMany({
      where: { authorId: currentUser.userId },
      include: {
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
        _count: {
          select: {
            favorites: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: perPage,
    });

    // Format recipes for display
    const formattedRecipes = recipes.map((recipe) => {
      return {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        status: recipe.status,
        rating: recipe.averageRating ? parseFloat(recipe.averageRating.toString()) : 0,
        reviewCount: recipe.reviewCount,
        favoriteCount: recipe._count.favorites,
        tags: recipe.tags.map((rt) => rt.tag.name),
        categories: recipe.categories.map((rc) => rc.category.name),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      };
    });

    return NextResponse.json({
      recipes: formattedRecipes,
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
