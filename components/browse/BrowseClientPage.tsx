"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import BrowseRecipeCard from "@/components/browse/BrowseRecipeCard";
import BrowseSidebarFiltersNew from "@/components/browse/BrowseSidebarFiltersNew";
import BrowseEmptyState from "@/components/browse/BrowseEmptyState";

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

interface FilterOption {
  id: string;
  name: string;
}

interface Recipe {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  image: string;
  time: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  difficulty: string | null;
  rating: number;
  reviewCount: number;
  author: {
    id: string;
    name: string;
    avatar: string;
    username?: string;
  };
  tags: string[];
  categories: string[];
  cuisine: string | null;
  allergens: string[];
}

interface PaginationInfo {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
}

interface BrowseClientPageProps {
  initialRecipes: Recipe[];
  pagination: PaginationInfo;
  categoryTree: CategoryNode[];
  tags: FilterOption[];
  cuisines: FilterOption[];
  allergens: FilterOption[];
  initialFilters: {
    query: string;
    categoryId: string;
    tags: string[];
    cuisines: string[];
    allergens: string[];
    difficulty: string;
    sort: string;
  };
}

export default function BrowseClientPage({
  initialRecipes,
  pagination,
  categoryTree,
  tags,
  cuisines,
  allergens,
  initialFilters,
}: BrowseClientPageProps) {
  const router = useRouter();
  
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [favoritedRecipes, setFavoritedRecipes] = useState<Set<string>>(new Set());

  // Build URL with current filters
  const buildURL = (params: Record<string, string | string[]>) => {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value) && value.length > 0) {
          urlParams.set(key, value.join(","));
        } else if (typeof value === "string" && value) {
          urlParams.set(key, value);
        }
      }
    });

    return `/browse${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildURL({
      q: searchInput,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: initialFilters.cuisines,
      allergens: initialFilters.allergens,
      difficulty: initialFilters.difficulty,
      sort: initialFilters.sort,
      page: "1",
    });
    router.push(url);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = initialFilters.tags.includes(tag)
      ? initialFilters.tags.filter((t) => t !== tag)
      : [...initialFilters.tags, tag];
    
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: newTags,
      cuisines: initialFilters.cuisines,
      allergens: initialFilters.allergens,
      difficulty: initialFilters.difficulty,
      sort: initialFilters.sort,
      page: "1",
    });
    router.push(url);
  };

  const handleCuisineToggle = (cuisine: string) => {
    const newCuisines = initialFilters.cuisines.includes(cuisine)
      ? initialFilters.cuisines.filter((c) => c !== cuisine)
      : [...initialFilters.cuisines, cuisine];
    
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: newCuisines,
      allergens: initialFilters.allergens,
      difficulty: initialFilters.difficulty,
      sort: initialFilters.sort,
      page: "1",
    });
    router.push(url);
  };

  const handleAllergenToggle = (allergen: string) => {
    const newAllergens = initialFilters.allergens.includes(allergen)
      ? initialFilters.allergens.filter((a) => a !== allergen)
      : [...initialFilters.allergens, allergen];
    
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: initialFilters.cuisines,
      allergens: newAllergens,
      difficulty: initialFilters.difficulty,
      sort: initialFilters.sort,
      page: "1",
    });
    router.push(url);
  };

  const handleDifficultyChange = (difficulty: string) => {
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: initialFilters.cuisines,
      allergens: initialFilters.allergens,
      difficulty,
      sort: initialFilters.sort,
      page: "1",
    });
    router.push(url);
  };

  const handleSortChange = (sort: string) => {
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: initialFilters.cuisines,
      allergens: initialFilters.allergens,
      difficulty: initialFilters.difficulty,
      sort,
      page: pagination.page.toString(),
    });
    router.push(url);
  };

  const clearAllFilters = () => {
    router.push("/browse");
  };

  const handlePageChange = (newPage: number) => {
    const url = buildURL({
      q: initialFilters.query,
      category: initialFilters.categoryId,
      tags: initialFilters.tags,
      cuisines: initialFilters.cuisines,
      allergens: initialFilters.allergens,
      difficulty: initialFilters.difficulty,
      sort: initialFilters.sort,
      page: newPage.toString(),
    });
    router.push(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavoriteToggle = async (recipeId: string) => {
    // Toggle in local state immediately for UI feedback
    setFavoritedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });

    // Actual API call would happen here
    // For now, we just update the UI state
  };

  const hasActiveFilters =
    !!initialFilters.query ||
    !!initialFilters.categoryId ||
    initialFilters.tags.length > 0 ||
    initialFilters.cuisines.length > 0 ||
    initialFilters.allergens.length > 0 ||
    !!initialFilters.difficulty;

  return (
    <div className="min-h-screen bg-bg dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-text dark:text-white">
            Browse Recipes
          </h1>
          <p className="text-base lg:text-lg text-text-secondary dark:text-text-muted">
            Discover amazing recipes from our community of home cooks
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-bg-secondary dark:bg-gray-800 rounded-xl shadow-sm p-4 lg:p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search recipes by title, description, or ingredients..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-bg-secondary dark:bg-gray-700 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="hidden lg:flex px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
            >
              Search
            </button>
            {/* TODO: Implement mobile filter modal - Issue #TBD */}
            <button
              type="button"
              onClick={() => alert("Mobile filters coming soon")}
              className="lg:hidden px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Filter size={20} />
            </button>
          </form>
        </div>

        {/* Active Filters - Simplified for now */}
        {hasActiveFilters && (
          <div className="mb-6">
            <button
              onClick={clearAllFilters}
              className="text-sm text-accent hover:text-accent-hover font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <BrowseSidebarFiltersNew
              categoryTree={categoryTree}
              tags={tags}
              cuisines={cuisines}
              allergens={allergens}
              selectedCategoryId={initialFilters.categoryId}
              selectedTags={initialFilters.tags}
              selectedCuisines={initialFilters.cuisines}
              selectedAllergens={initialFilters.allergens}
              selectedDifficulty={initialFilters.difficulty}
              sortOption={initialFilters.sort}
              onTagToggle={handleTagToggle}
              onCuisineToggle={handleCuisineToggle}
              onAllergenToggle={handleAllergenToggle}
              onDifficultyChange={handleDifficultyChange}
              onSortChange={handleSortChange}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary dark:text-text-muted">
                Showing {initialRecipes.length} of {pagination.totalCount} recipes
              </p>
              
              {/* Mobile Sort */}
              <div className="lg:hidden">
                <select
                  value={initialFilters.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-bg-secondary dark:bg-gray-800 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {/* Recipe Grid / Empty State */}
            {initialRecipes.length === 0 ? (
              <BrowseEmptyState 
                hasFilters={hasActiveFilters} 
                onClearFilters={hasActiveFilters ? clearAllFilters : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {initialRecipes.map((recipe) => (
                    <BrowseRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorited={favoritedRecipes.has(recipe.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-bg-secondary dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg dark:hover:bg-gray-700 transition flex items-center gap-2 text-text dark:text-white"
                    >
                      <ChevronLeft size={20} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {/* Show first page */}
                      {pagination.page > 3 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="w-10 h-10 rounded-lg bg-bg-secondary dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-bg dark:hover:bg-gray-700 transition text-text dark:text-white"
                          >
                            1
                          </button>
                          {pagination.page > 4 && (
                            <span className="text-gray-500">...</span>
                          )}
                        </>
                      )}
                      
                      {/* Show pages around current page */}
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        if (pageNum < Math.max(1, pagination.page - 2)) return null;
                        if (pageNum > Math.min(pagination.totalPages, pagination.page + 2)) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg transition ${
                              pagination.page === pageNum
                                ? "bg-amber-600 text-white"
                                : "bg-bg-secondary dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-bg dark:hover:bg-gray-700 text-text dark:text-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {/* Show last page */}
                      {pagination.page < pagination.totalPages - 2 && (
                        <>
                          {pagination.page < pagination.totalPages - 3 && (
                            <span className="text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="w-10 h-10 rounded-lg bg-bg-secondary dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-bg dark:hover:bg-gray-700 transition text-text dark:text-white"
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-bg-secondary dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg dark:hover:bg-gray-700 transition flex items-center gap-2 text-text dark:text-white"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
