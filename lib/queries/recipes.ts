import { prisma } from "@/lib/prisma";
import { RecipeStatus, Prisma, Difficulty } from "@prisma/client";
import { DEFAULT_RECIPE_IMAGE, DEFAULT_USER_AVATAR } from "@/lib/constants";

/**
 * Extract primary image URL from media array
 */
function getPrimaryImageUrl(media?: Array<{ url: string; secureUrl: string | null; isPrimary: boolean }>): string {
  if (!media || media.length === 0) {
    return DEFAULT_RECIPE_IMAGE;
  }
  const primary = media.find(m => m.isPrimary);
  const fallback = media[0];
  const selected = primary || fallback;
  return selected?.secureUrl || selected?.url || DEFAULT_RECIPE_IMAGE;
}

/**
 * Extract profile avatar URL from media array
 */
function getProfileAvatarUrl(media?: Array<{ url: string; secureUrl: string | null; isProfileAvatar: boolean }>): string {
  if (!media || media.length === 0) {
    return DEFAULT_USER_AVATAR;
  }
  const avatar = media.find(m => m.isProfileAvatar);
  if (!avatar) {
    return DEFAULT_USER_AVATAR;
  }
  return avatar.secureUrl || avatar.url || DEFAULT_USER_AVATAR;
}

/**
 * Format recipe data with calculated ratings
 */
export function formatRecipeWithRatings(recipe: {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  author: {
    username: string;
    media?: Array<{ url: string; secureUrl: string | null; isProfileAvatar: boolean }>;
  };
  media?: Array<{ url: string; secureUrl: string | null; isPrimary: boolean }>;
  reviews?: { rating: number }[];
}) {
  const reviews = recipe.reviews || [];
  const totalRating = reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return {
    id: recipe.slug || recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    image: getPrimaryImageUrl(recipe.media),
    time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
    rating: Math.round(averageRating),
    author: {
      name: recipe.author.username,
      username: recipe.author.username,
      avatar: getProfileAvatarUrl(recipe.author.media),
    },
  };
}

/**
 * Get popular recipes based on favorites count in the last week
 */
export async function getPopularRecipes(limit: number = 6) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recipes = await prisma.recipe.findMany({
    where: {
      status: RecipeStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      description: true,
      author: {
        select: {
          username: true,
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
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
      reviews: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          favorites: {
            where: {
              createdAt: {
                gte: oneWeekAgo,
              },
            },
          },
        },
      },
    },
    orderBy: [{ favorites: { _count: "desc" } }],
    take: limit,
  });

  return recipes.map(formatRecipeWithRatings);
}

/**
 * Get recently published recipes
 */
export async function getRecentRecipes(limit: number = 4) {
  const recipes = await prisma.recipe.findMany({
    where: {
      status: RecipeStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      author: {
        select: {
          username: true,
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
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
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
    take: limit,
  });

  return recipes.map(formatRecipeWithRatings);
}

/**
 * Get featured recipe (best rated with minimum reviews)
 */
export async function getFeaturedRecipe() {
  const recipes = await prisma.recipe.findMany({
    where: { 
      status: RecipeStatus.PUBLISHED, 
      reviews: { some: {} } 
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true } },
      author: {
        select: {
          username: true,
        },
      },
      media: {
        select: {
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (!recipes.length) return null;

  // Always have at least the first recipe
  let featured = recipes[0];
  let highestScore = 0;

  for (const r of recipes) {
    if (r._count.reviews >= 2) {
      const avg = r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r._count.reviews;
      const score = avg * Math.min(r._count.reviews / 5, 1);
      if (score > highestScore) {
        highestScore = score;
        featured = r;
      }
    }
  }

  return {
    id: featured.id,
    slug: featured.slug,
    username: featured.author.username,
    title: "Recipe of the Day",
    description:
      featured.description ||
      "Every day we feature an exceptional recipe that showcases the creativity and skill of our community. Today's featured dish combines fresh seasonal ingredients with classic techniques for an unforgettable dining experience.",
    image: getPrimaryImageUrl(featured.media),
  };
}

/**
 * Get recipe by slug and username
 */
export async function getRecipeBySlug(username: string, slug: string) {
  return prisma.recipe.findFirst({
    where: { 
      slug,
      author: {
        username
      }
    },
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
      cuisine: true,
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
}

/**
 * Get related recipes based on categories or tags
 */
export async function getRelatedRecipes(recipeId: string, categoryIds: string[], tagIds: string[], limit: number = 3) {
  return prisma.recipe.findMany({
    where: {
      id: { not: recipeId },
      status: RecipeStatus.PUBLISHED,
      OR: [
        {
          categories: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
        },
        {
          tags: {
            some: {
              tagId: {
                in: tagIds,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      difficulty: true,
      averageRating: true,
      description: true,
      author: {
        select: {
          username: true,
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
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    take: limit,
    orderBy: {
      averageRating: 'desc',
    },
  });
}

/**
 * Search and filter recipes with pagination
 */
export async function searchRecipes({
  query = "",
  categories = [],
  tags = [],
  cuisines = [],
  allergens = [],
  difficulty = "",
  minPrepTime = null,
  maxPrepTime = null,
  minCookTime = null,
  maxCookTime = null,
  sort = "newest",
  page = 1,
  perPage = 12,
}: {
  query?: string;
  categories?: string[];
  tags?: string[];
  cuisines?: string[];
  allergens?: string[];
  difficulty?: string;
  minPrepTime?: number | null;
  maxPrepTime?: number | null;
  minCookTime?: number | null;
  maxCookTime?: number | null;
  sort?: string;
  page?: number;
  perPage?: number;
}) {
  const skip = (page - 1) * perPage;

  // Build where clause
  const where: Prisma.RecipeWhereInput = { status: RecipeStatus.PUBLISHED };

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

  if (categories.length > 0) {
    where.categories = {
      some: {
        category: {
          name: { in: categories, mode: "insensitive" },
        },
      },
    };
  }

  if (tags.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: { in: tags, mode: "insensitive" },
        },
      },
    };
  }

  if (cuisines.length > 0) {
    where.cuisine = {
      name: { in: cuisines, mode: "insensitive" },
    };
  }

  if (allergens.length > 0) {
    where.allergens = {
      some: {
        allergen: {
          name: { in: allergens, mode: "insensitive" },
        },
      },
    };
  }

  // Validate and set difficulty filter
  if (difficulty && Object.values(Difficulty).includes(difficulty as Difficulty)) {
    where.difficulty = difficulty as Difficulty;
  }

  if (minPrepTime !== null || maxPrepTime !== null) {
    where.prepTimeMinutes = {};
    if (minPrepTime !== null) where.prepTimeMinutes.gte = minPrepTime;
    if (maxPrepTime !== null) where.prepTimeMinutes.lte = maxPrepTime;
  }

  if (minCookTime !== null || maxCookTime !== null) {
    where.cookTimeMinutes = {};
    if (minCookTime !== null) where.cookTimeMinutes.gte = minCookTime;
    if (maxCookTime !== null) where.cookTimeMinutes.lte = maxCookTime;
  }

  // Get total count
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

  // Get recipes
  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          username: true,
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
          url: true,
          secureUrl: true,
          isPrimary: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "asc" },
        ],
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

  // Format recipes
  const formattedRecipes = recipes.map((recipe) => ({
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    image: getPrimaryImageUrl(recipe.media),
    time: (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    rating: recipe.averageRating ? parseFloat(recipe.averageRating.toString()) : 0,
    reviewCount: recipe.reviewCount,
    author: {
      id: recipe.author.id,
      name: recipe.author.username,
      avatar: getProfileAvatarUrl(recipe.author.media),
      username: recipe.author.username,
    },
    tags: recipe.tags.map((rt) => rt.tag.name),
    categories: recipe.categories.map((rc) => rc.category.name),
    cuisine: recipe.cuisine?.name || null,
    allergens: recipe.allergens.map((ra) => ra.allergen.name),
    createdAt: recipe.createdAt,
  }));

  return {
    recipes: formattedRecipes,
    pagination: {
      page,
      perPage,
      totalCount,
      totalPages: Math.ceil(totalCount / perPage),
    },
  };
}
