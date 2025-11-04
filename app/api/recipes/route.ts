import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RecipeStatus } from "@prisma/client";
import { saveRecipeToFile } from "@/lib/recipeStorage";
import { searchRecipes } from "@/lib/queries/recipes";
import { log } from "@/lib/logger";
import { RecipeSchema } from "@/lib/schemas/recipe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get("q") || "";
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const cuisines = searchParams.get("cuisines")?.split(",").filter(Boolean) || [];
    const allergens = searchParams.get("allergens")?.split(",").filter(Boolean) || [];
    const difficulty = searchParams.get("difficulty") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    
    const minPrepTime = searchParams.get("minPrepTime")
      ? parseInt(searchParams.get("minPrepTime")!)
      : null;
    const maxPrepTime = searchParams.get("maxPrepTime")
      ? parseInt(searchParams.get("maxPrepTime")!)
      : null;
    const minCookTime = searchParams.get("minCookTime")
      ? parseInt(searchParams.get("minCookTime")!)
      : null;
    const maxCookTime = searchParams.get("maxCookTime")
      ? parseInt(searchParams.get("maxCookTime")!)
      : null;

    // Use reusable search function
    const result = await searchRecipes({
      query,
      categories,
      tags,
      cuisines,
      allergens,
      difficulty,
      minPrepTime,
      maxPrepTime,
      minCookTime,
      maxCookTime,
      sort,
      page,
      perPage,
    });

    log.info({ 
      totalCount: result.pagination.totalCount, 
      page, 
      perPage, 
      hasQuery: !!query,
      filters: { categories: categories.length, tags: tags.length, cuisines: cuisines.length }
    }, "Fetched recipes successfully");

    return NextResponse.json(result);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Error fetching recipes"
    );
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
/**
 * POST /api/recipes
 * Create a new recipe with all related data
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      log.warn({}, "Unauthorized recipe creation attempt");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate with Zod schema for security
    const validation = RecipeSchema.safeParse(body);
    if (!validation.success) {
      log.warn(
        { userId: currentUser.userId, errors: validation.error.issues },
        "Recipe validation failed"
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
      calories,
      proteinG,
      fatG,
      carbsG,
      ingredients,
      tags,
      categories,
      allergens,
      status,
      mediaIds,
    } = validation.data;

    // Generate slug from title
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug },
    });

    if (existingRecipe) {
      log.warn({ userId: currentUser.userId, title, slug }, "Recipe creation attempt with duplicate slug");
      return NextResponse.json(
        { error: "A recipe with this title already exists" },
        { status: 409 }
      );
    }

    // Process steps: renumber within each group
    let processedSteps: Array<{
      stepNumber: number;
      instruction: string;
      groupName: string | null;
      isOptional: boolean;
    }> = [];

    if (steps && Array.isArray(steps) && steps.length > 0) {
      // First, sort by original stepNumber to maintain order
      const sortedSteps = [...steps].sort(
        (a, b) => a.stepNumber - b.stepNumber
      );

      // Group steps and renumber within each group
      const groupCounts: Record<string, number> = {};

      processedSteps = sortedSteps.map((step) => {
        const group = step.groupName || "Main";

        // Initialize counter for this group if not exists
        if (!groupCounts[group]) {
          groupCounts[group] = 0;
        }

        // Increment and assign step number within group
        groupCounts[group]++;

        return {
          stepNumber: groupCounts[group],
          instruction: step.instruction,
          groupName: step.groupName || null,
          isOptional: step.isOptional || false,
        };
      });
    }

    // Create recipe with all relations in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Handle cuisine
      let cuisineId = null;
      if (cuisineName && cuisineName.trim()) {
        let cuisine = await tx.cuisine.findUnique({
          where: { name: cuisineName.trim() },
        });

        if (!cuisine) {
          cuisine = await tx.cuisine.create({
            data: { name: cuisineName.trim() },
          });
        }

        cuisineId = cuisine.id;
      }

      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          authorId: currentUser.userId,
          title,
          slug,
          description,
          servings,
          prepTimeMinutes,
          cookTimeMinutes,
          difficulty: difficulty || null,
          sourceUrl: sourceUrl || null,
          sourceText: sourceText || null,
          chefNotes: chefNotes || null,
          cuisineId,
          status: status || RecipeStatus.PUBLISHED,
          calories,
          proteinG,
          fatG,
          carbsG,
        },
      });

      // Create steps with renumbered stepNumbers
      if (processedSteps.length > 0) {
        await tx.recipeStep.createMany({
          data: processedSteps.map((step) => ({
            recipeId: newRecipe.id,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            groupName: step.groupName,
            isOptional: step.isOptional,
          })),
        });
      }

      // Create ingredients
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing, idx) => ({
            recipeId: newRecipe.id,
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

      // Link pre-uploaded media to the recipe
      if (mediaIds && Array.isArray(mediaIds) && mediaIds.length > 0) {
        // Verify media belongs to current user and update recipeId
        await tx.media.updateMany({
          where: {
            id: { in: mediaIds },
            userId: currentUser.userId,
            recipeId: null, // Only update media not yet associated with a recipe
          },
          data: {
            recipeId: newRecipe.id,
          },
        });
        
        // Set the first media as primary if no primary is set
        const firstMediaId = mediaIds[0];
        await tx.media.updateMany({
          where: {
            id: firstMediaId,
            recipeId: newRecipe.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }

      return newRecipe;
    });

    // Get full recipe data with all relations for JSON export
    const fullRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: {
          orderBy: { displayOrder: "asc" },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        categories: {
          include: { category: true },
        },
        allergens: {
          include: { allergen: true },
        },
        cuisine: true,
      },
    });

    // Save recipe to JSON file in development mode
    if (fullRecipe) {
      const recipeDataForFile = {
        title: fullRecipe.title,
        slug: fullRecipe.slug,
        description: fullRecipe.description,
        servings: fullRecipe.servings,
        prepTimeMinutes: fullRecipe.prepTimeMinutes,
        cookTimeMinutes: fullRecipe.cookTimeMinutes,
        difficulty: fullRecipe.difficulty,
        sourceUrl: fullRecipe.sourceUrl,
        sourceText: fullRecipe.sourceText,
        chefNotes: fullRecipe.chefNotes,
        status: fullRecipe.status,
        calories: fullRecipe.calories,
        proteinG: fullRecipe.proteinG,
        fatG: fullRecipe.fatG,
        carbsG: fullRecipe.carbsG,
        cuisine: fullRecipe.cuisine?.name || null,
        ingredients: fullRecipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          size: ing.size,
          preparation: ing.preparation,
          notes: ing.notes,
          groupName: ing.groupName,
          isOptional: ing.isOptional,
          displayOrder: ing.displayOrder,
        })),
        steps: fullRecipe.steps.map((step) => ({
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          groupName: step.groupName,
          isOptional: step.isOptional,
        })),
        tags: fullRecipe.tags.map((rt) => rt.tag.name),
        categories: fullRecipe.categories.map((rc) => rc.category.name),
        allergens: fullRecipe.allergens.map((ra) => ra.allergen.name),
      };

      await saveRecipeToFile(recipe.slug!, recipeDataForFile);
    }

    // Get author username for response
    const author = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { username: true },
    });

    log.info(
      { userId: currentUser.userId, recipeId: recipe.id, slug: recipe.slug, status: recipe.status },
      "Recipe created successfully"
    );

    return NextResponse.json(
      {
        ...recipe,
        slug: recipe.slug,
        username: author?.username,
      },
      { status: 201 }
    );
  } catch (error) {
    log.error(
      { 
        userId: (await getCurrentUser())?.userId,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
      },
      "Create recipe error"
    );
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
