import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchRecipes } from "@/lib/queries/recipes";
import { getDescendantCategoryIdsForMultiple } from "@/lib/category-utils";

// Using Node.js runtime for Prisma compatibility
export const runtime = "nodejs";

// Cache filter metadata for 5 minutes (300 seconds)
export const revalidate = 300;

/**
 * GET /api/recipes/search
 * Search and filter recipes with support for client-side filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const query = searchParams.get("q") || "";
    const categoryFilterIds = searchParams.get("category")?.split(",").filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const cuisineFilterIds = searchParams.get("cuisines")?.split(",").filter(Boolean) || [];
    const allergens = searchParams.get("allergens")?.split(",").filter(Boolean) || [];
    const difficulty = searchParams.get("difficulty") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "12");

    // Handle hierarchical category filtering (optimized)
    let selectedCategoryNames: string[] = [];

    if (categoryFilterIds.length > 0) {
      // Get all descendant category IDs for all selected categories
      const categoryIdsToFilter = await getDescendantCategoryIdsForMultiple(
        categoryFilterIds,
        prisma
      );

      // Get category names for the selected IDs
      const categoriesData = await prisma.category.findMany({
        where: { id: { in: categoryIdsToFilter } },
        select: { name: true },
      });
      selectedCategoryNames = categoriesData.map((c) => c.name);
    }

    // Convert cuisine IDs to names for searchRecipes
    let cuisineNames: string[] = [];
    if (cuisineFilterIds.length > 0) {
      const cuisinesData = await prisma.cuisine.findMany({
        where: { id: { in: cuisineFilterIds } },
        select: { name: true },
      });
      cuisineNames = cuisinesData.map((c) => c.name);
    }

    // Fetch recipes with hierarchical filtering
    const result = await searchRecipes({
      query,
      categories: selectedCategoryNames,
      tags,
      cuisines: cuisineNames,
      allergens,
      difficulty,
      sort,
      page,
      perPage,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error in /api/recipes/search:", error);
    return NextResponse.json(
      { error: "Failed to search recipes" },
      { status: 500 }
    );
  }
}
