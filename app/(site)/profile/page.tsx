// app/profile/page.js
"use client";

import { useState, useEffect } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ChefHat, Heart, Settings, Loader2, Edit } from "lucide-react";
import Button from "@/components/Button";
import Image from "next/image";

interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  favoriteCount: number;
  tags: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

type Tab = "recipes" | "favorites" | "settings";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (activeTab === "recipes") {
      fetchUserRecipes();
    } else if (activeTab === "favorites") {
      fetchFavorites();
    }
  }, [activeTab]);

  const fetchUserRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/recipes");
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {user?.username}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {user && new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("recipes")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "recipes"
                    ? "text-amber-600 border-b-2 border-amber-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ChefHat size={20} />
                My Recipes ({recipes.length})
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "favorites"
                    ? "text-amber-600 border-b-2 border-amber-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Heart size={20} />
                Favorites ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === "settings"
                    ? "text-amber-600 border-b-2 border-amber-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Settings size={20} />
                Settings
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-amber-600" size={48} />
            </div>
          ) : (
            <>
              {activeTab === "recipes" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Recipes</h2>
                    <Button
                      onClick={() => router.push("/recipes/new")}
                      variant="primary"
                    >
                      Create New Recipe
                    </Button>
                  </div>

                  {recipes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <ChefHat className="mx-auto mb-4 text-gray-400" size={64} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No recipes yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start sharing your culinary creations with the community
                      </p>
                      <Button
                        onClick={() => router.push("/recipes/new")}
                        variant="primary"
                      >
                        Create Your First Recipe
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {recipe.imageUrl && (
                            <div className="relative h-48">
                              <Image
                                src={recipe.imageUrl}
                                alt={recipe.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {recipe.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {recipe.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                              <span>⭐ {recipe.rating > 0 ? recipe.rating : "No ratings"}</span>
                              <span>❤️ {recipe.favoriteCount}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => router.push(`/recipes/${recipe.slug}`)}
                                variant="secondary"
                                className="flex-1"
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => router.push(`/recipes/edit/${recipe.slug}`)}
                                variant="secondary"
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "favorites" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Favorite Recipes</h2>

                  {favorites.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <Heart className="mx-auto mb-4 text-gray-400" size={64} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No favorites yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start exploring recipes and save your favorites
                      </p>
                      <Button
                        onClick={() => router.push("/browse")}
                        variant="primary"
                      >
                        Browse Recipes
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => router.push(`/recipes/${recipe.slug}`)}
                        >
                          {recipe.imageUrl && (
                            <div className="relative h-48">
                              <Image
                                src={recipe.imageUrl}
                                alt={recipe.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {recipe.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {recipe.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                              <span>⭐ {recipe.rating > 0 ? recipe.rating : "No ratings"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={user?.username || ""}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                      <Button
                        onClick={logout}
                        variant="secondary"
                        className="bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Log Out
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}