import { prisma } from "@/lib/prisma";
import { RecipeStatus } from "@prisma/client";
import { DEFAULT_RECIPE_IMAGE, DEFAULT_CHEF_AVATAR } from "@/lib/constants";

/**
 * Get sort order for user recipes
 */
function getSortOrder(sort: "newest" | "oldest" | "popular") {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" as const };
    case "popular":
      return [
        { averageRating: "desc" as const },
        { reviewCount: "desc" as const },
      ];
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

/**
 * Get user by ID with basic info
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      bio: true,
      role: true,
      createdAt: true,
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
  });
}

/**
 * Get user recipes with optional sorting
 */
export async function getUserRecipes(
  userId: string,
  sort: "newest" | "oldest" | "popular" = "newest"
) {
  const orderBy = getSortOrder(sort);

  const recipes = await prisma.recipe.findMany({
    where: {
      authorId: userId,
      status: RecipeStatus.PUBLISHED,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      servings: true,
      status: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
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
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
      _count: {
        select: {
          favorites: true,
        },
      },
    },
    orderBy,
  });

  return recipes.map((recipe) => {
    const primaryImage =
      recipe.media?.find((m) => m.isPrimary) || recipe.media?.[0];
    const imageUrl =
      primaryImage?.secureUrl || primaryImage?.url || DEFAULT_RECIPE_IMAGE;

    return {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      imageUrl,
      prepTimeMinutes: recipe.prepTimeMinutes || 0,
      cookTimeMinutes: recipe.cookTimeMinutes || 0,
      servings: recipe.servings,
      status: recipe.status,
      rating: recipe.averageRating
        ? parseFloat(recipe.averageRating.toString())
        : 0,
      reviewCount: recipe.reviewCount,
      favoriteCount: recipe._count.favorites,
      tags: recipe.tags.map((rt) => rt.tag.name),
      categories: recipe.categories.map((rc) => rc.category.name),
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      author: {
        username: recipe.author.username,
      },
    };
  });
}

/**
 * Get spotlight chef (user with highest average rating and multiple recipes)
 */
export async function getSpotlightChef() {
  const users = await prisma.user.findMany({
    where: {
      recipes: {
        some: {
          status: RecipeStatus.PUBLISHED,
        },
      },
    },
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
      recipes: {
        select: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        where: {
          status: RecipeStatus.PUBLISHED,
        },
      },
      _count: {
        select: {
          recipes: {
            where: {
              status: RecipeStatus.PUBLISHED,
            },
          },
        },
      },
    },
    orderBy: {
      recipes: {
        _count: "desc",
      },
    },
    take: 5,
  });

  let spotlight = null;
  let highestAvgRating = 0;

  for (const user of users) {
    if (user._count.recipes < 3) continue;

    let totalRatings = 0;
    let ratingCount = 0;

    user.recipes.forEach((recipe) => {
      recipe.reviews.forEach((review) => {
        totalRatings += review.rating;
        ratingCount++;
      });
    });

    const avgRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

    if (avgRating > highestAvgRating) {
      highestAvgRating = avgRating;
      const avatar = user.media[0];
      spotlight = {
        id: user.id,
        name: user.username,
        title: "Home Cook & Food Blogger",
        avatar: avatar?.secureUrl || avatar?.url || DEFAULT_CHEF_AVATAR,
        quote:
          user.bio ||
          "Cooking is my passion, and I love sharing family recipes that have been passed down through generations. My goal is to help others discover the joy of creating delicious meals from scratch.",
      };
    }
  }

  if (!spotlight && users.length > 0) {
    const topContributor = users[0];
    const avatar = topContributor.media[0];
    spotlight = {
      id: topContributor.id,
      name: topContributor.username,
      title: "Home Cook & Food Blogger",
      avatar: avatar?.secureUrl || avatar?.url || DEFAULT_CHEF_AVATAR,
      quote:
        topContributor.bio ||
        "Sharing my passion for food through delicious recipes.",
    };
  }

  return spotlight;
}

/**
 * Get user's favorite recipes
 */
export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favoriteRecipe.findMany({
    where: {
      userId,
    },
    include: {
      recipe: {
        include: {
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
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return favorites.map((fav) => {
    const primaryImage =
      fav.recipe.media?.find((m) => m.isPrimary) || fav.recipe.media?.[0];
    const imageUrl =
      primaryImage?.secureUrl || primaryImage?.url || DEFAULT_RECIPE_IMAGE;

    return {
      id: fav.recipe.id,
      slug: fav.recipe.slug,
      title: fav.recipe.title,
      description: fav.recipe.description,
      imageUrl,
      prepTimeMinutes: fav.recipe.prepTimeMinutes || 0,
      cookTimeMinutes: fav.recipe.cookTimeMinutes || 0,
      servings: fav.recipe.servings,
      status: fav.recipe.status,
      rating: fav.recipe.averageRating
        ? parseFloat(fav.recipe.averageRating.toString())
        : 0,
      reviewCount: fav.recipe.reviewCount,
      tags: fav.recipe.tags.map((rt) => rt.tag.name),
      categories: fav.recipe.categories.map((rc) => rc.category.name),
      createdAt: fav.recipe.createdAt.toISOString(),
      updatedAt: fav.recipe.updatedAt.toISOString(),
      author: {
        username: fav.recipe.author.username,
      },
    };
  });
}
