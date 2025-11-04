import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { RecipeSchema } from "@/lib/schemas/recipe";

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
            bio: true,
            media: {
              where: { isProfileAvatar: true },
              select: {
                url: true,
                secureUrl: true,
                isProfileAvatar: true,
              },
              take: 1,
            },
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            secureUrl: true,
            isPrimary: true,
            altText: true,
            width: true,
            height: true,
          },
          orderBy: [
            { isPrimary: "desc" },
            { createdAt: "asc" },
          ],
        },
        cuisines: {
          include: {
            cuisine: true,
          },
        },
        ingredients: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        steps: {
          orderBy: {
            stepNumber: 'asc',
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
      log.warn({ slug }, "Recipe not found");
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
      cuisines: recipe.cuisines.map(rc => rc.cuisine),
      allergens: recipe.allergens.map(ra => ra.allergen),
    };

    log.info({ slug, recipeId: recipe.id }, "Recipe fetched successfully");

    return NextResponse.json(transformedRecipe);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Get recipe by slug error"
    );
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
      log.warn({ userId: currentUser.userId, recipeId: existingRecipe.id, slug }, "User attempted to edit recipe they don't own");
      return NextResponse.json(
        { error: "You don't have permission to edit this recipe" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate with Zod schema for security
    const validation = RecipeSchema.safeParse(body);
    if (!validation.success) {
      log.warn(
        { userId: currentUser.userId, slug, errors: validation.error.issues },
        "Recipe update validation failed"
      );
      return NextResponse.json(
        { 
          error: "Invalid recipe data",
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }
    
    const {
      title,
      description,
      steps,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
      sourceUrl,
      sourceText,
      chefNotes,
      cuisineName,
      cuisines,
      calories,
      proteinG,
      fatG,
      carbsG,
      ingredients,
      tags,
      categories,
      allergens,
      status,
    } = validation.data;

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
      // Update the recipe (without cuisineId)
      const recipe = await tx.recipe.update({
        where: { id: existingRecipe.id },
        data: {
          title: title ?? existingRecipe.title,
          slug: newSlug,
          description,
          servings,
          prepTimeMinutes,
          cookTimeMinutes,
          difficulty: difficulty ?? existingRecipe.difficulty,
          sourceUrl,
          sourceText,
          chefNotes,
          status: status ?? existingRecipe.status,
          calories,
          proteinG,
          fatG,
          carbsG,
        },
      });

      // Update cuisines if provided (many-to-many)
      const cuisineNames = cuisines && cuisines.length > 0 
        ? cuisines 
        : (cuisineName !== undefined && cuisineName && cuisineName.trim() ? [cuisineName.trim()] : undefined);
      
      if (cuisineNames !== undefined) {
        // Delete existing cuisine relations
        await tx.recipesCuisines.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new cuisine relations
        if (cuisineNames.length > 0) {
          for (const cuisName of cuisineNames) {
            const cuisine = await tx.cuisine.findUnique({
              where: { name: cuisName },
            });

            if (cuisine) {
              await tx.recipesCuisines.create({
                data: {
                  recipeId: recipe.id,
                  cuisineId: cuisine.id,
                },
              });
            }
          }
        }
      }

      // Update steps if provided
      if (steps !== undefined && Array.isArray(steps)) {
        // Delete existing steps
        await tx.recipeStep.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new steps
        if (steps.length > 0) {
          await tx.recipeStep.createMany({
            data: steps.map((step: { stepNumber: number; instruction: string; groupName?: string | null; isOptional?: boolean }) => ({
              recipeId: recipe.id,
              stepNumber: step.stepNumber,
              instruction: step.instruction,
              groupName: step.groupName || null,
              isOptional: step.isOptional || false,
            })),
          });
        }
      }

      // Update ingredients if provided
      if (ingredients !== undefined && Array.isArray(ingredients)) {
        // Delete existing ingredients
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: recipe.id },
        });

        // Create new ingredients
        if (ingredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: ingredients.map((ing, idx) => ({
              recipeId: recipe.id,
              name: ing.name,
              amount: ing.amount || null,
              unit: ing.unit || null,
              size: ing.size || null,
              preparation: ing.preparation || null,
              notes: ing.notes || null,
              groupName: ing.groupName || null,
              isOptional: ing.isOptional || false,
              displayOrder: ing.displayOrder ?? idx,
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

    // Get author username for response
    const author = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { username: true }
    });

    log.info({ userId: currentUser.userId, recipeId: updatedRecipe.id, slug }, "Recipe updated successfully");

    return NextResponse.json({
      ...updatedRecipe,
      slug: updatedRecipe.slug,
      username: author?.username,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Update recipe error"
    );
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
      log.warn({}, "Unauthorized recipe deletion attempt");
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

    log.info({ userId: currentUser.userId, recipeId: existingRecipe.id, slug }, "Recipe deleted successfully");

    return NextResponse.json({
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Delete recipe error"
    );
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }
}
