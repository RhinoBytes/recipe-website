import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RecipeStatus } from "@prisma/client";
import { DEFAULT_CHEF_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    // Get users with most highly-rated recipes
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
      take: 5, // Get top 5 contributors
    });

    // Find the user with the highest average rating across their recipes
    let spotlightChef = null;
    let highestAvgRating = 0;

    for (const user of users) {
      if (user._count.recipes < 3) continue; // Must have at least 3 recipes

      // Calculate average rating across all recipes
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
        const avatarMedia = user.media[0];
        const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_CHEF_AVATAR;
        
        spotlightChef = {
          id: user.id,
          name: user.username,
          title: `Recipe Contributor with ${user._count.recipes} recipes`,
          avatar: avatarUrl,
          quote:
            user.bio ||
            "Cooking is not just about ingredients, it's about bringing joy to the table.",
        };
      }
    }

    // If no suitable chef found, use the most prolific contributor
    if (!spotlightChef && users.length > 0) {
      const topContributor = users[0];
      const avatarMedia = topContributor.media[0];
      const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_CHEF_AVATAR;
      
      spotlightChef = {
        id: topContributor.id,
        name: topContributor.username,
        title: `Recipe Contributor with ${topContributor._count.recipes} recipes`,
        avatar: avatarUrl,
        quote:
          topContributor.bio ||
          "Sharing my passion for food through delicious recipes.",
      };
    }

    log.info({ chefId: spotlightChef?.id || null }, "Fetched spotlight chef successfully");

    return NextResponse.json({ chef: spotlightChef });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Failed to fetch spotlight chef"
    );
    return NextResponse.json(
      { error: "Failed to fetch spotlight chef" },
      { status: 500 }
    );
  }
}
