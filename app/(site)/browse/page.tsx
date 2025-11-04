import { prisma } from "@/lib/prisma";
import { getDescendantCategoryIds, buildCategoryTree } from "@/lib/category-utils";
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

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Parse search parameters
  const query = searchParams.q || "";
  const categoryFilterId = searchParams.category;
  const tags = searchParams.tags?.split(",").filter(Boolean) || [];
  const cuisines = searchParams.cuisines?.split(",").filter(Boolean) || [];
  const allergens = searchParams.allergens?.split(",").filter(Boolean) || [];
  const difficulty = searchParams.difficulty || "";
  const sort = searchParams.sort || "newest";
  const page = parseInt(searchParams.page || "1");
  const perPage = 12;

  // Handle hierarchical category filtering
  let categoryIdsToFilter: string[] = [];
  let selectedCategoryNames: string[] = [];

  if (categoryFilterId) {
    // Get all descendant category IDs (including the parent)
    categoryIdsToFilter = await getDescendantCategoryIds(
      categoryFilterId,
      prisma
    );

    // Get category names for the selected IDs
    const categoriesData = await prisma.category.findMany({
      where: { id: { in: categoryIdsToFilter } },
      select: { name: true },
    });
    selectedCategoryNames = categoriesData.map((c) => c.name);
  }

  // Fetch recipes with hierarchical filtering
  const result = await searchRecipes({
    query,
    categories: selectedCategoryNames,
    tags,
    cuisines,
    allergens,
    difficulty,
    sort,
    page,
    perPage,
  });

  // Fetch all categories for the filter sidebar
  const allCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Build hierarchical category tree
  const categoryTree = buildCategoryTree(allCategories);

  // Fetch all tags
  const allTags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all cuisines
  const allCuisines = await prisma.cuisine.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all allergens
  const allAllergens = await prisma.allergen.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
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
        categoryId: categoryFilterId || "",
        tags,
        cuisines,
        allergens,
        difficulty,
        sort,
      }}
    />
  );
}
