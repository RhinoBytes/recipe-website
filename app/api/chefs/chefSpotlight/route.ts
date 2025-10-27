import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get users with most highly-rated recipes
    const users = await prisma.user.findMany({
      where: {
        recipes: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        recipes: {
          select: {
            reviews: {
              select: {
                rating: true,
              },
            },
          },
          where: {
            status: "PUBLISHED",
          },
        },
        _count: {
          select: {
            recipes: {
              where: {
                status: "PUBLISHED",
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
        spotlightChef = {
          id: user.id,
          name: user.username,
          title: `Recipe Contributor with ${user._count.recipes} recipes`,
          avatar: user.avatarUrl || "/images/chefs/default.jpg",
          quote:
            user.bio ||
            "Cooking is not just about ingredients, it's about bringing joy to the table.",
        };
      }
    }

    // If no suitable chef found, use the most prolific contributor
    if (!spotlightChef && users.length > 0) {
      const topContributor = users[0];
      spotlightChef = {
        id: topContributor.id,
        name: topContributor.username,
        title: `Recipe Contributor with ${topContributor._count.recipes} recipes`,
        avatar: topContributor.avatarUrl || "/images/chefs/default.jpg",
        quote:
          topContributor.bio ||
          "Sharing my passion for food through delicious recipes.",
      };
    }

    return NextResponse.json({ chef: spotlightChef });
  } catch (error) {
    console.error("Failed to fetch spotlight chef:", error);
    return NextResponse.json(
      { error: "Failed to fetch spotlight chef" },
      { status: 500 }
    );
  }
}
