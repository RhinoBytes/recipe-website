import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/recipes/[slug]
 * Get a recipe by its slug with all related data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        ingredients: {
          orderBy: {
            displayOrder: 'asc',
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
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Transform the data to a cleaner format
    const transformedRecipe = {
      ...recipe,
      tags: recipe.tags.map(rt => rt.tag),
      categories: recipe.categories.map(rc => rc.category),
      allergens: recipe.allergens.map(ra => ra.allergen),
    };

    return NextResponse.json(transformedRecipe);
  } catch (error) {
    console.error("Get recipe by slug error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    );
  }
}
