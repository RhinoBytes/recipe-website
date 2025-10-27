import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

/**
 * PATCH /api/recipes/[slug]
 * Update an existing recipe (author only)
 */
export async function PATCH(
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

    // Check if recipe exists and user is the author
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    if (existingRecipe.authorId !== currentUser.userId) {
      return NextResponse.json(
        { error: "You don't have permission to edit this recipe" },
        { status: 403 }
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

    // Generate new slug if title changed
    let newSlug = existingRecipe.slug;
    if (title && title !== existingRecipe.title) {
      newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if new slug is already taken by another recipe
      const slugTaken = await prisma.recipe.findFirst({
        where: {
          slug: newSlug,
          id: { not: existingRecipe.id },
        },
      });

      if (slugTaken) {
        return NextResponse.json(
          { error: "A recipe with this title already exists" },
          { status: 409 }
        );
      }
    }

    // Update recipe with all relations in a transaction
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Update the recipe
      const recipe = await tx.recipe.update({
        where: { id: existingRecipe.id },
        data: {
          title: title ?? existingRecipe.title,
          slug: newSlug,
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
        },
      });

      // Update ingredients if provided
      if (ingredients !== undefined && Array.isArray(ingredients)) {
        // Delete existing ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new ingredients
        if (ingredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: ingredients.map((ing: { amount?: number | null; unit?: string | null; name: string; displayOrder?: number }, index: number) => ({
              recipeId: recipe.id,
              amount: ing.amount,
              unit: ing.unit,
              name: ing.name,
              displayOrder: ing.displayOrder ?? index,
            })),
          });
        }
      }

      // Update tags if provided
      if (tags !== undefined && Array.isArray(tags)) {
        // Delete existing tag relations
        await tx.recipesTags.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new tag relations
        for (const tagName of tags) {
          let tag = await tx.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName },
            });
          }

          await tx.recipesTags.create({
            data: {
              recipeId: recipe.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Update categories if provided
      if (categories !== undefined && Array.isArray(categories)) {
        // Delete existing category relations
        await tx.recipesCategories.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new category relations
        for (const categoryName of categories) {
          const category = await tx.category.findUnique({
            where: { name: categoryName },
          });

          if (category) {
            await tx.recipesCategories.create({
              data: {
                recipeId: recipe.id,
                categoryId: category.id,
              },
            });
          }
        }
      }

      // Update allergens if provided
      if (allergens !== undefined && Array.isArray(allergens)) {
        // Delete existing allergen relations
        await tx.recipesAllergens.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new allergen relations
        for (const allergenName of allergens) {
          const allergen = await tx.allergen.findUnique({
            where: { name: allergenName },
          });

          if (allergen) {
            await tx.recipesAllergens.create({
              data: {
                recipeId: recipe.id,
                allergenId: allergen.id,
              },
            });
          }
        }
      }

      return recipe;
    });

    return NextResponse.json({
      ...updatedRecipe,
      slug: updatedRecipe.slug,
    });
  } catch (error) {
    console.error("Update recipe error:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[slug]
 * Delete a recipe (author only)
 */
export async function DELETE(
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

    // Check if recipe exists and user is the author
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    if (existingRecipe.authorId !== currentUser.userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this recipe" },
        { status: 403 }
      );
    }

    // Delete recipe (cascade will handle relations)
    await prisma.recipe.delete({
      where: { id: existingRecipe.id },
    });

    return NextResponse.json({
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Delete recipe error:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
