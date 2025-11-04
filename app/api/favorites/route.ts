import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_RECIPE_IMAGE, DEFAULT_USER_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

/**
 * GET /api/favorites
 * Get all favorite recipes for the currently authenticated user
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favoriteRecipe.findMany({
      where: { userId: currentUser.userId },
      include: {
        recipe: {
          include: {
            media: {
              select: {
                url: true,
                secureUrl: true,
                isPrimary: true,
              },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            },
            author: {
              select: {
                id: true,
                username: true,
                media: {
                  where: { isProfileAvatar: true },
                  select: {
                    url: true,
                    secureUrl: true,
                  },
                  take: 1,
                },
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
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format favorites for display
    const formattedFavorites = favorites.map(({ recipe }) => {
      const totalRating = recipe.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        recipe.reviews.length > 0
          ? Math.round(totalRating / recipe.reviews.length)
          : 0;

      const primaryMedia =
        recipe.media.find((m) => m.isPrimary) || recipe.media[0];
      const imageUrl =
        primaryMedia?.secureUrl || primaryMedia?.url || DEFAULT_RECIPE_IMAGE;

      const avatarMedia = recipe.author.media[0];
      const avatar =
        avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

      return {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        imageUrl,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        rating: averageRating,
        reviewCount: recipe.reviews.length,
        author: {
          id: recipe.author.id,
          username: recipe.author.username,
          avatar,
        },
        tags: recipe.tags.map((rt) => rt.tag.name),
        categories: recipe.categories.map((rc) => rc.category.name),
      };
    });

    return NextResponse.json({
      favorites: formattedFavorites,
    });
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
      },
      "Error fetching favorites"
    );
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Add a recipe to favorites
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      log.warn({}, "Unauthorized favorite add attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId } = body;

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: currentUser.userId,
          recipeId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: "Recipe already favorited" },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favoriteRecipe.create({
      data: {
        userId: currentUser.userId,
        recipeId,
      },
    });

    log.info(
      { userId: currentUser.userId, recipeId },
      "Recipe added to favorites"
    );

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
      },
      "Error adding favorite"
    );
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites
 * Remove a recipe from favorites
 */
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      log.warn({}, "Unauthorized favorite delete attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: currentUser.userId,
          recipeId,
        },
      },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    // Delete favorite
    await prisma.favoriteRecipe.delete({
      where: {
        userId_recipeId: {
          userId: currentUser.userId,
          recipeId,
        },
      },
    });

    log.info(
      { userId: currentUser.userId, recipeId },
      "Recipe removed from favorites"
    );

    return NextResponse.json({
      message: "Favorite removed successfully",
    });
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
      },
      "Error removing favorite"
    );
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
