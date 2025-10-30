import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  Prisma,
  Difficulty,
  RecipeStatus,
  MeasurementSystem,
} from "@prisma/client";
import { saveRecipeToFile } from "@/lib/recipeStorage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    
    // Support multiple values for filters
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const cuisines = searchParams.get("cuisines")?.split(",").filter(Boolean) || [];
    const allergens = searchParams.get("allergens")?.split(",").filter(Boolean) || [];
    const difficulty = searchParams.get("difficulty") || "";
    
    // Time filters
    const minPrepTime = searchParams.get("minPrepTime") ? parseInt(searchParams.get("minPrepTime")!) : null;
    const maxPrepTime = searchParams.get("maxPrepTime") ? parseInt(searchParams.get("maxPrepTime")!) : null;
    const minCookTime = searchParams.get("minCookTime") ? parseInt(searchParams.get("minCookTime")!) : null;
    const maxCookTime = searchParams.get("maxCookTime") ? parseInt(searchParams.get("maxCookTime")!) : null;
    
    // Sort option
    const sort = searchParams.get("sort") || "newest";
    
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    const skip = (page - 1) * perPage;

    // Build where clause with filters
    const where: Prisma.RecipeWhereInput = { status: RecipeStatus.PUBLISHED };

    // Text search on title, description, and ingredients
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        {
          ingredients: {
            some: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        },
      ];
    }

    // Filter by multiple categories
    if (categories.length > 0) {
      where.categories = {
        some: {
          category: {
            name: { in: categories, mode: "insensitive" },
          },
        },
      };
    }

    // Filter by multiple tags
    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags, mode: "insensitive" },
          },
        },
      };
    }

    // Filter by multiple cuisines
    if (cuisines.length > 0) {
      where.cuisine = {
        name: { in: cuisines, mode: "insensitive" },
      };
    }

    // Filter by multiple allergens
    if (allergens.length > 0) {
      where.allergens = {
        some: {
          allergen: {
            name: { in: allergens, mode: "insensitive" },
          },
        },
      };
    }

    // Filter by difficulty
    if (difficulty && Object.values(Difficulty).includes(difficulty as Difficulty)) {
      where.difficulty = difficulty as Difficulty;
    }

    // Filter by prep time range
    if (minPrepTime !== null || maxPrepTime !== null) {
      where.prepTimeMinutes = {};
      if (minPrepTime !== null) where.prepTimeMinutes.gte = minPrepTime;
      if (maxPrepTime !== null) where.prepTimeMinutes.lte = maxPrepTime;
    }

    // Filter by cook time range
    if (minCookTime !== null || maxCookTime !== null) {
      where.cookTimeMinutes = {};
      if (minCookTime !== null) where.cookTimeMinutes.gte = minCookTime;
      if (maxCookTime !== null) where.cookTimeMinutes.lte = maxCookTime;
    }

    // Get total count for pagination
    const totalCount = await prisma.recipe.count({ where });

    // Determine sort order
    let orderBy: Prisma.RecipeOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sort === "popular") {
      orderBy = [
        { averageRating: "desc" },
        { reviewCount: "desc" },
      ] as Prisma.RecipeOrderByWithRelationInput;
    }

    // Get recipes with pagination
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
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
        cuisine: true,
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // Format recipes for display with ratings
    const formattedRecipes = recipes.map((recipe) => {
      return {
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        image: recipe.imageUrl || "/images/recipes/default.jpg",
        time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        rating: recipe.averageRating
          ? parseFloat(recipe.averageRating.toString())
          : 0,
        reviewCount: recipe.reviewCount,
        author: {
          id: recipe.author.id,
          name: recipe.author.username,
          avatar: recipe.author.avatarUrl || recipe.author.username.charAt(0),
          username: recipe.author.username,
        },
        tags: recipe.tags.map((rt) => rt.tag.name),
        categories: recipe.categories.map((rc) => rc.category.name),
        cuisine: recipe.cuisine?.name || null,
        allergens: recipe.allergens.map((ra) => ra.allergen.name),
        createdAt: recipe.createdAt,
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
    console.error("Error fetching recipes:", error);
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
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      steps,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
      imageUrl,
      sourceUrl,
      sourceText,
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
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate difficulty if provided
    if (difficulty && !Object.values(Difficulty).includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty value. Must be EASY, MEDIUM, or HARD" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(RecipeStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be DRAFT or PUBLISHED" },
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
          imageUrl,
          sourceUrl: sourceUrl || null,
          sourceText: sourceText || null,
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
        for (const ing of ingredients) {
          const ingredient = await tx.recipeIngredient.create({
            data: {
              recipeId: newRecipe.id,
              name: ing.name,
              size: ing.size || null,
              preparation: ing.preparation || null,
              notes: ing.notes || null,
              groupName: ing.groupName || null,
              isOptional: ing.isOptional || false,
              displayOrder: ing.displayOrder ?? ingredients.indexOf(ing),
            },
          });

          // Create measurements for this ingredient
          if (ing.measurements && Array.isArray(ing.measurements) && ing.measurements.length > 0) {
            await tx.ingredientMeasurement.createMany({
              data: ing.measurements.map((measurement: {
                system: MeasurementSystem;
                amount: string;
                unit: string;
              }) => ({
                recipeIngredientId: ingredient.id,
                system: measurement.system,
                amount: measurement.amount,
                unit: measurement.unit,
              })),
            });
          }
        }
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

    // Get full recipe data with all relations for JSON export
    const fullRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: {
          include: {
            measurements: true,
          },
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
        imageUrl: fullRecipe.imageUrl,
        sourceUrl: fullRecipe.sourceUrl,
        sourceText: fullRecipe.sourceText,
        status: fullRecipe.status,
        calories: fullRecipe.calories,
        proteinG: fullRecipe.proteinG,
        fatG: fullRecipe.fatG,
        carbsG: fullRecipe.carbsG,
        cuisine: fullRecipe.cuisine?.name || null,
        ingredients: fullRecipe.ingredients.map((ing) => ({
          name: ing.name,
          size: ing.size,
          preparation: ing.preparation,
          notes: ing.notes,
          groupName: ing.groupName,
          isOptional: ing.isOptional,
          displayOrder: ing.displayOrder,
          measurements: ing.measurements,
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

    return NextResponse.json(
      {
        ...recipe,
        slug: recipe.slug,
        username: author?.username,
      },
      { status: 201 }
    );
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
