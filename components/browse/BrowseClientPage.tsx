"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import BrowseRecipeCard from "@/components/browse/BrowseRecipeCard";
import BrowseSidebarFiltersNew from "@/components/browse/BrowseSidebarFiltersNew";
import BrowseEmptyState from "@/components/browse/BrowseEmptyState";
import BrowseMobileFilters from "@/components/browse/BrowseMobileFilters";
import BrowseLoadingSkeleton from "@/components/browse/BrowseLoadingSkeleton";
import { log } from "@/lib/logger";

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
    categoryIds: string[];
    tags: string[];
    cuisineIds: string[];
    allergens: string[];
    difficulty: string;
    sort: string;
  };
}

export default function BrowseClientPage({
  initialRecipes,
  pagination: initialPagination,
  categoryTree,
  tags,
  cuisines,
  allergens,
  initialFilters,
}: BrowseClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchInput, setSearchInput] = useState(initialFilters.query);
  const [recipes, setRecipes] = useState(initialRecipes);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [favoritedRecipes, setFavoritedRecipes] = useState<Set<string>>(new Set());
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Current active filters from URL
  const [currentFilters, setCurrentFilters] = useState(initialFilters);

  // Track in-flight requests to prevent duplicate fetches
  const [isFetching, setIsFetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch recipes from API with current filters
  const fetchRecipes = useCallback(async (filters: typeof initialFilters, page: number) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Prevent duplicate requests
    if (isFetching) {
      return;
    }

    setIsLoading(true);
    setIsFetching(true);
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Track performance
    const startTime = performance.now();
    
    try {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.categoryIds.length > 0) params.set("category", filters.categoryIds.join(","));
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
      if (filters.cuisineIds.length > 0) params.set("cuisines", filters.cuisineIds.join(","));
      if (filters.allergens.length > 0) params.set("allergens", filters.allergens.join(","));
      if (filters.difficulty) params.set("difficulty", filters.difficulty);
      params.set("sort", filters.sort);
      params.set("page", page.toString());
      params.set("perPage", "12");

      const response = await fetch(`/api/recipes/search?${params.toString()}`, {
        signal: controller.signal,
      });
      
      if (!response.ok) throw new Error("Failed to fetch recipes");
      
      const data = await response.json();
      setRecipes(data.recipes);
      setPagination(data.pagination);

      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        log.info({ duration }, `Browse fetch completed in ${duration.toFixed(0)}ms`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled - this is normal, no need to log
        return;
      }
      log.error({ error }, "Error fetching recipes");
      // Keep showing current recipes on error for better UX
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      abortControllerRef.current = null;
    }
  }, [isFetching]);

  // Update URL without page reload
  const updateURL = useCallback((filters: typeof initialFilters, page: number) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set("q", filters.query);
    if (filters.categoryIds.length > 0) params.set("category", filters.categoryIds.join(","));
    if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
    if (filters.cuisineIds.length > 0) params.set("cuisines", filters.cuisineIds.join(","));
    if (filters.allergens.length > 0) params.set("allergens", filters.allergens.join(","));
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (page > 1) params.set("page", page.toString());

    const url = `/browse${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(url, { scroll: false });
  }, [router]);

  // Apply filter changes - fetch data and update URL
  const applyFilters = useCallback(async (newFilters: typeof initialFilters, newPage: number = 1) => {
    setCurrentFilters(newFilters);
    updateURL(newFilters, newPage);
    await fetchRecipes(newFilters, newPage);
  }, [updateURL, fetchRecipes]);

  // Generic toggle handler for filters - now with client-side fetching
  const handleToggleFilter = async (filterKey: string, id: string) => {
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    const existing = currentParams.get(filterKey) || '';
    const values = existing ? existing.split(',').filter(Boolean) : [];
    
    const index = values.indexOf(id);
    if (index === -1) {
      values.push(id);
    } else {
      values.splice(index, 1);
    }
    
    // Update the appropriate filter array
    const newFilters = { ...currentFilters };
    if (filterKey === 'category') {
      newFilters.categoryIds = values;
    } else if (filterKey === 'tags') {
      newFilters.tags = values;
    } else if (filterKey === 'cuisines') {
      newFilters.cuisineIds = values;
    } else if (filterKey === 'allergens') {
      newFilters.allergens = values;
    }
    
    await applyFilters(newFilters, 1);
  };

  // Mobile filter handlers - same as desktop
  const handleCategoryToggle = (categoryId: string) => {
    handleToggleFilter('category', categoryId);
  };

  const handleTagToggle = (tagId: string) => {
    handleToggleFilter('tags', tagId);
  };

  const handleCuisineToggle = (cuisineId: string) => {
    handleToggleFilter('cuisines', cuisineId);
  };

  const handleAllergenToggle = (allergenId: string) => {
    handleToggleFilter('allergens', allergenId);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any pending debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    const newFilters = { ...currentFilters, query: searchInput };
    await applyFilters(newFilters, 1);
  };

  // Debounced search input handler
  // NOTE: Auto-search feature is available but disabled by default
  // To enable: uncomment the setTimeout code below (300ms debounce recommended for UX)
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Optional: Enable auto-search by uncommenting below
    // User must currently press Enter or click Search button
    /*
    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...currentFilters, query: value };
      applyFilters(newFilters, 1);
    }, 300);
    */
  };

  const handleDifficultyChange = async (difficulty: string) => {
    const newFilters = { ...currentFilters, difficulty };
    await applyFilters(newFilters, 1);
  };

  const handleSortChange = async (sort: string) => {
    const newFilters = { ...currentFilters, sort };
    await applyFilters(newFilters, pagination.page);
  };

  const clearAllFilters = async () => {
    const emptyFilters = {
      query: "",
      categoryIds: [],
      tags: [],
      cuisineIds: [],
      allergens: [],
      difficulty: "",
      sort: "newest",
    };
    setSearchInput("");
    await applyFilters(emptyFilters, 1);
  };

  const handlePageChange = async (newPage: number) => {
    await applyFilters(currentFilters, newPage);
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
    !!currentFilters.query ||
    currentFilters.categoryIds.length > 0 ||
    currentFilters.tags.length > 0 ||
    currentFilters.cuisineIds.length > 0 ||
    currentFilters.allergens.length > 0 ||
    !!currentFilters.difficulty;

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
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Search recipes by title, description, or ingredients..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-bg-secondary dark:bg-gray-700 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="hidden lg:flex px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Filter size={20} />
            </button>
          </form>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-6">
            <button
              onClick={clearAllFilters}
              disabled={isLoading}
              className="text-sm text-accent hover:text-accent-hover font-medium disabled:opacity-50"
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
              selectedCategoryIds={currentFilters.categoryIds}
              selectedTags={currentFilters.tags}
              selectedCuisineIds={currentFilters.cuisineIds}
              selectedAllergens={currentFilters.allergens}
              selectedDifficulty={currentFilters.difficulty}
              sortOption={currentFilters.sort}
              onCategoryToggle={handleCategoryToggle}
              onTagToggle={handleTagToggle}
              onCuisineToggle={handleCuisineToggle}
              onAllergenToggle={handleAllergenToggle}
              onDifficultyChange={handleDifficultyChange}
              onSortChange={handleSortChange}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Mobile Filter Modal */}
          <BrowseMobileFilters
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            categoryTree={categoryTree}
            tags={tags}
            cuisines={cuisines}
            allergens={allergens}
            selectedCategoryIds={currentFilters.categoryIds}
            selectedTags={currentFilters.tags}
            selectedCuisineIds={currentFilters.cuisineIds}
            selectedAllergens={currentFilters.allergens}
            selectedDifficulty={currentFilters.difficulty}
            sortOption={currentFilters.sort}
            onCategoryToggle={handleCategoryToggle}
            onTagToggle={handleTagToggle}
            onCuisineToggle={handleCuisineToggle}
            onAllergenToggle={handleAllergenToggle}
            onDifficultyChange={handleDifficultyChange}
            onSortChange={handleSortChange}
            onClearAll={clearAllFilters}
            isLoading={isLoading}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary dark:text-text-muted">
                {isLoading ? "Loading..." : `Showing ${recipes.length} of ${pagination.totalCount} recipes`}
              </p>
              
              {/* Mobile Sort */}
              <div className="lg:hidden">
                <select
                  value={currentFilters.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-bg-secondary dark:bg-gray-800 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && <BrowseLoadingSkeleton />}

            {/* Recipe Grid / Empty State */}
            {!isLoading && (
              <>
                {recipes.length === 0 ? (
                  <BrowseEmptyState 
                    hasFilters={hasActiveFilters} 
                    onClearFilters={hasActiveFilters ? clearAllFilters : undefined}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {recipes.map((recipe) => (
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
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
