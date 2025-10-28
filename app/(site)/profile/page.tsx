// app/profile/page.js
"use client";

import { useState, useEffect } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ChefHat, Heart, Settings, Loader2, Edit, X } from "lucide-react";
import Button from "@/components/Button";
import AvatarPicker from "@/components/AvatarPicker";
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
  status: string;
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
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  
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

  const handleAvatarSelect = async (avatarUrl: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (response.ok) {
        await refreshUser();
        setShowAvatarModal(false);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update avatar");
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      alert("Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      setUsernameError("Username cannot be empty");
      return;
    }

    if (newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    setSaving(true);
    setUsernameError("");
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });

      if (response.ok) {
        await refreshUser();
        setEditingUsername(false);
      } else {
        const data = await response.json();
        setUsernameError(data.error || "Failed to update username");
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      setUsernameError("Failed to update username");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 border-amber-600 hover:border-amber-700 transition-all hover:scale-105 cursor-pointer group"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.username || "User avatar"}
                    width={96}
                    height={96}
                    className="object-cover"
                    unoptimized={user.avatarUrl.startsWith('data:')}
                  />
                ) : (
                  <span className="text-4xl font-bold text-white bg-amber-600 w-full h-full flex items-center justify-center">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Edit className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                </div>
              </button>
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
                          {editingUsername ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                placeholder="Enter new username"
                              />
                              {usernameError && (
                                <p className="text-sm text-red-600">{usernameError}</p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleUsernameUpdate}
                                  variant="primary"
                                  size="sm"
                                  loading={saving}
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingUsername(false);
                                    setNewUsername("");
                                    setUsernameError("");
                                  }}
                                  variant="secondary"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={user?.username || ""}
                                disabled
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                              />
                              <Button
                                onClick={() => {
                                  setEditingUsername(true);
                                  setNewUsername(user?.username || "");
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                <Edit size={16} />
                              </Button>
                            </div>
                          )}
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

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Select Avatar</h2>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
              <AvatarPicker
                currentAvatar={user?.avatarUrl || ""}
                onSelect={handleAvatarSelect}
              />
              {saving && (
                <div className="mt-4 text-center text-gray-600">
                  Updating avatar...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}