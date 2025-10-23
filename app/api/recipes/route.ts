import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: { isPublished: true },
    include: {
      author: true,
      tags: true,
      categories: true,
    },
  });

  return Response.json(recipes);
}

/**
 * POST /api/recipes
 * Create a new recipe with all related data
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      instructions,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      imageUrl,
      calories,
      proteinG,
      fatG,
      carbsG,
      ingredients,
      tags,
      categories,
      allergens,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug },
    });

    if (existingRecipe) {
      return NextResponse.json(
        { error: "A recipe with this title already exists" },
        { status: 409 }
      );
    }

    // Create recipe with all relations in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          authorId: currentUser.userId,
          title,
          slug,
          description,
          instructions,
          servings,
          prepTimeMinutes,
          cookTimeMinutes,
          imageUrl,
          isPublished: true,
          calories,
          proteinG,
          fatG,
          carbsG,
        },
      });

      // Create ingredients
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing: { amount?: number | null; unit?: string | null; name: string; displayOrder?: number }, index: number) => ({
            recipeId: newRecipe.id,
            amount: ing.amount,
            unit: ing.unit,
            name: ing.name,
            displayOrder: ing.displayOrder ?? index,
          })),
        });
      }

      // Handle tags
      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create tag
          let tag = await tx.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName },
            });
          }

          // Link tag to recipe
          await tx.recipesTags.create({
            data: {
              recipeId: newRecipe.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Handle categories
      if (categories && Array.isArray(categories) && categories.length > 0) {
        for (const categoryName of categories) {
          // Find category
          const category = await tx.category.findUnique({
            where: { name: categoryName },
          });

          if (category) {
            await tx.recipesCategories.create({
              data: {
                recipeId: newRecipe.id,
                categoryId: category.id,
              },
            });
          }
        }
      }

      // Handle allergens
      if (allergens && Array.isArray(allergens) && allergens.length > 0) {
        for (const allergenName of allergens) {
          // Find allergen
          const allergen = await tx.allergen.findUnique({
            where: { name: allergenName },
          });

          if (allergen) {
            await tx.recipesAllergens.create({
              data: {
                recipeId: newRecipe.id,
                allergenId: allergen.id,
              },
            });
          }
        }
      }

      return newRecipe;
    });

    return NextResponse.json({
      ...recipe,
      slug: recipe.slug,
    }, { status: 201 });
  } catch (error) {
    console.error("Create recipe error:", error);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

