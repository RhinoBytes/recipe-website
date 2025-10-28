"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import BrowseRecipeCard from "@/components/browse/BrowseRecipeCard";
import BrowseSidebarFilters from "@/components/browse/BrowseSidebarFilters";
import BrowseMobileFilters from "@/components/browse/BrowseMobileFilters";
import BrowseActiveFilters from "@/components/browse/BrowseActiveFilters";
import BrowseLoadingSkeleton from "@/components/browse/BrowseLoadingSkeleton";
import BrowseEmptyState from "@/components/browse/BrowseEmptyState";

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface Recipe {
  id: string;
  slug: string;
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

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Filter options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [tags, setTags] = useState<FilterOption[]>([]);
  const [cuisines, setCuisines] = useState<FilterOption[]>([]);
  const [allergens, setAllergens] = useState<FilterOption[]>([]);
  
  // Selected filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    perPage: 12,
    totalCount: 0,
    totalPages: 0,
  });
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [favoritedRecipes, setFavoritedRecipes] = useState<Set<string>>(new Set());

  // Initialize from URL parameters
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const cats = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const t = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const cuis = searchParams.get("cuisines")?.split(",").filter(Boolean) || [];
    const allergs = searchParams.get("allergens")?.split(",").filter(Boolean) || [];
    const diff = searchParams.get("difficulty") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");

    setSearchQuery(query);
    setSearchInput(query);
    setSelectedCategories(cats);
    setSelectedTags(t);
    setSelectedCuisines(cuis);
    setSelectedAllergens(allergs);
    setSelectedDifficulty(diff);
    setSortOption(sort);
    setPagination(prev => ({ ...prev, page }));
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback((params: Record<string, string | string[] | number>) => {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value) && value.length > 0) {
          urlParams.set(key, value.join(","));
        } else if (typeof value === "string" && value) {
          urlParams.set(key, value);
        } else if (typeof value === "number") {
          urlParams.set(key, value.toString());
        }
      }
    });

    router.push(`/browse?${urlParams.toString()}`, { scroll: false });
  }, [router]);

  // Fetch filter options
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [catsRes, tagsRes, cuisRes, allergsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/cuisines"),
          fetch("/api/allergens"),
        ]);

        if (catsRes.ok) {
          const data = await catsRes.json();
          setCategories(data);
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setTags(data);
        }
        if (cuisRes.ok) {
          const data = await cuisRes.json();
          setCuisines(data);
        }
        if (allergsRes.ok) {
          const data = await allergsRes.json();
          setAllergens(data);
        }
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      });

      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategories.length > 0) params.append("categories", selectedCategories.join(","));
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
      if (selectedCuisines.length > 0) params.append("cuisines", selectedCuisines.join(","));
      if (selectedAllergens.length > 0) params.append("allergens", selectedAllergens.join(","));
      if (selectedDifficulty) params.append("difficulty", selectedDifficulty);
      if (sortOption) params.append("sort", sortOption);

      const response = await fetch(`/api/recipes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, searchQuery, selectedCategories, selectedTags, selectedCuisines, selectedAllergens, selectedDifficulty, sortOption]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Update URL when filters change
  useEffect(() => {
    updateURL({
      q: searchQuery,
      categories: selectedCategories,
      tags: selectedTags,
      cuisines: selectedCuisines,
      allergens: selectedAllergens,
      difficulty: selectedDifficulty,
      sort: sortOption,
      page: pagination.page,
    });
  }, [searchQuery, selectedCategories, selectedTags, selectedCuisines, selectedAllergens, selectedDifficulty, sortOption, pagination.page, updateURL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSearchInput("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedCuisines([]);
    setSelectedAllergens([]);
    setSelectedDifficulty("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFavoriteToggle = async (recipeId: string) => {
    // Toggle in local state immediately for UI feedback
    setFavoritedRecipes(prev => {
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
    searchQuery ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedAllergens.length > 0 ||
    selectedDifficulty;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            Browse Recipes
          </h1>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">
            Discover amazing recipes from our community of home cooks
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 lg:p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search recipes by title, description, or ingredients..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="hidden lg:flex px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <Filter size={20} />
            </button>
          </form>
        </div>

        {/* Active Filters */}
        <BrowseActiveFilters
          searchQuery={searchQuery}
          selectedCategories={selectedCategories}
          selectedTags={selectedTags}
          selectedCuisines={selectedCuisines}
          selectedAllergens={selectedAllergens}
          selectedDifficulty={selectedDifficulty}
          onRemoveSearch={() => {
            setSearchQuery("");
            setSearchInput("");
          }}
          onRemoveCategory={(cat) => handleCategoryToggle(cat)}
          onRemoveTag={(tag) => handleTagToggle(tag)}
          onRemoveCuisine={(cuisine) => handleCuisineToggle(cuisine)}
          onRemoveAllergen={(allergen) => handleAllergenToggle(allergen)}
          onRemoveDifficulty={() => setSelectedDifficulty("")}
          onClearAll={clearAllFilters}
        />

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <BrowseSidebarFilters
              categories={categories}
              tags={tags}
              cuisines={cuisines}
              allergens={allergens}
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              selectedCuisines={selectedCuisines}
              selectedAllergens={selectedAllergens}
              selectedDifficulty={selectedDifficulty}
              sortOption={sortOption}
              onCategoryToggle={handleCategoryToggle}
              onTagToggle={handleTagToggle}
              onCuisineToggle={handleCuisineToggle}
              onAllergenToggle={handleAllergenToggle}
              onDifficultyChange={handleDifficultyChange}
              onSortChange={handleSortChange}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Mobile Filters */}
          <BrowseMobileFilters
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            categories={categories}
            tags={tags}
            cuisines={cuisines}
            allergens={allergens}
            selectedCategories={selectedCategories}
            selectedTags={selectedTags}
            selectedCuisines={selectedCuisines}
            selectedAllergens={selectedAllergens}
            selectedDifficulty={selectedDifficulty}
            sortOption={sortOption}
            onCategoryToggle={handleCategoryToggle}
            onTagToggle={handleTagToggle}
            onCuisineToggle={handleCuisineToggle}
            onAllergenToggle={handleAllergenToggle}
            onDifficultyChange={handleDifficultyChange}
            onSortChange={handleSortChange}
            onClearAll={clearAllFilters}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    Showing {recipes.length} of {pagination.totalCount} recipes
                  </>
                )}
              </p>
              
              {/* Mobile Sort */}
              <div className="lg:hidden">
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>

            {/* Recipe Grid / Loading / Empty State */}
            {loading ? (
              <BrowseLoadingSkeleton />
            ) : recipes.length === 0 ? (
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
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-900 dark:text-white"
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
                            className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"
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
                                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
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
                            className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-900 dark:text-white"
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

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  );
}