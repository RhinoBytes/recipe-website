import { prisma } from "@/lib/prisma";
import { getDescendantCategoryIdsForMultiple, buildCategoryTree } from "@/lib/category-utils";
import { searchRecipes } from "@/lib/queries/recipes";
import BrowseClientPage from "@/components/browse/BrowseClientPage";

interface SearchParams {
  q?: string;
  category?: string;
  tags?: string;
  cuisines?: string;
  allergens?: string;
  difficulty?: string;
  sort?: string;
  page?: string;
}

// Enable ISR with 60 second revalidation for better performance
export const revalidate = 60;

// Enable dynamic rendering for search params
export const dynamic = 'force-dynamic';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Parse search parameters
  const query = searchParams.q || "";
  const categoryFilterIds = searchParams.category?.split(",").filter(Boolean) || [];
  const tags = searchParams.tags?.split(",").filter(Boolean) || [];
  const cuisineFilterIds = searchParams.cuisines?.split(",").filter(Boolean) || [];
  const allergens = searchParams.allergens?.split(",").filter(Boolean) || [];
  const difficulty = searchParams.difficulty || "";
  const sort = searchParams.sort || "newest";
  const page = parseInt(searchParams.page || "1");
  const perPage = 12;

  // Parallel fetch: Get all filter metadata in parallel (categories, tags, cuisines, allergens)
  // These are independent queries that can be executed simultaneously
  const [allCategories, allTags, allCuisines, allAllergens] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.cuisine.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.allergen.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  // Build hierarchical category tree (in-memory, no DB calls)
  const categoryTree = buildCategoryTree(allCategories);

  // Handle hierarchical category filtering (optimized with parallel queries)
  let categoryIdsToFilter: string[] = [];
  let selectedCategoryNames: string[] = [];

  if (categoryFilterIds.length > 0) {
    // Get all descendant category IDs for all selected categories
    categoryIdsToFilter = await getDescendantCategoryIdsForMultiple(
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

  // Pass data to client component
  return (
    <BrowseClientPage
      initialRecipes={result.recipes}
      pagination={result.pagination}
      categoryTree={categoryTree}
      tags={allTags}
      cuisines={allCuisines}
      allergens={allAllergens}
      initialFilters={{
        query,
        categoryIds: categoryFilterIds,
        tags,
        cuisineIds: cuisineFilterIds,
        allergens,
        difficulty,
        sort,
      }}
    />
  );
}
