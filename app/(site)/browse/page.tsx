"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, Star, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  time: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  rating: number;
  reviewCount: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  tags: string[];
  categories: string[];
}

interface PaginationInfo {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
}

function BrowsePageContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    perPage: 12,
    totalCount: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search query from URL on mount
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      setShowFilters(true);
    }
  }, [searchParams]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
      });

      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedTag) params.append("tag", selectedTag);

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
  }, [pagination.page, pagination.perPage, searchQuery, selectedCategory, selectedTag]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data: Category[] = await response.json();
          setCategories(data.map((cat) => cat.name));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
    setPagination({ ...pagination, page: 1 });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTag("");
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Browse Recipes</h1>
        <p className="text-lg text-gray-600 mb-8">
          Discover amazing recipes from our community of home cooks.
        </p>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes by title, description, or ingredients..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <Filter size={20} />
                Filters
              </button>
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="pt-4 border-t">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === category
                          ? "bg-amber-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedCategory || selectedTag) && (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Search: {searchQuery}
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Category: {selectedCategory}
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <p>
              Showing {recipes.length} of {pagination.totalCount} recipes
            </p>
          )}
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No recipes found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.slug}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition group"
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-amber-600 transition line-clamp-2">
                      {recipe.title}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                          {recipe.author.avatar.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs">{recipe.author.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {recipe.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star size={14} fill="currentColor" className="text-yellow-400" />
                            <span className="text-xs">{recipe.rating}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {recipe.time} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                        className={`w-10 h-10 rounded-lg transition ${
                          pagination.page === pageNum
                            ? "bg-amber-600 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 px-4 py-12">
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