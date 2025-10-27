import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const tag = searchParams.get("tag") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");
    const skip = (page - 1) * perPage;

    // Build where clause with filters
    const where: Prisma.RecipeWhereInput = { isPublished: true };

    // Text search on title, description, and instructions
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { instructions: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filter by category
    if (category) {
      where.categories = {
        some: {
          category: {
            name: { equals: category, mode: "insensitive" },
          },
        },
      };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { equals: tag, mode: "insensitive" },
          },
        },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.recipe.count({ where });

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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: perPage,
    });

    // Format recipes for display with ratings
    const formattedRecipes = recipes.map((recipe) => {
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
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        image: recipe.imageUrl || "/images/recipes/default.jpg",
        time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        rating: averageRating,
        reviewCount: recipe.reviews.length,
        author: {
          id: recipe.author.id,
          name: recipe.author.username,
          avatar: recipe.author.avatarUrl || recipe.author.username.charAt(0),
        },
        tags: recipe.tags.map((rt) => rt.tag.name),
        categories: recipe.categories.map((rc) => rc.category.name),
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
      instructions,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
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
          difficulty,
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

    // Get author username for response
    const author = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { username: true }
    });

    return NextResponse.json({
      ...recipe,
      slug: recipe.slug,
      username: author?.username,
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

