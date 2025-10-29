// app/profile/[userId]/page.tsx
"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ChefHat, Heart, Settings, Loader2, Edit, X, ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import AvatarPicker from "@/components/AvatarPicker";
import Image from "next/image";
import Link from "next/link";

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
  author?: {
    username: string;
  };
}

interface ProfileUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

type Tab = "recipes" | "favorites" | "settings";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const { user: currentUser, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "popular">("newest");

  const isOwnProfile = currentUser?.id === resolvedParams.userId;
  console.log("currentUser?.userId:", currentUser?.id);
  console.log("isOwnProfile:", isOwnProfile);

  // Fetch profile user data
  useEffect(() => {
    const fetchProfileUser = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/users/${resolvedParams.userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileUser(data.user);
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileUser();
  }, [resolvedParams.userId]);

  const fetchUserRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${resolvedParams.userId}/recipes?sort=${sortOption}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.userId, sortOption]);

  const fetchFavorites = useCallback(async () => {
    if (!isOwnProfile) return;
    
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
  }, [isOwnProfile]);

  // Fetch recipes when tab changes or sort changes
  useEffect(() => {
    if (profileUser) {
      if (activeTab === "recipes") {
        fetchUserRecipes();
      } else if (activeTab === "favorites" && isOwnProfile) {
        fetchFavorites();
      }
    }
  }, [activeTab, profileUser, isOwnProfile, sortOption, fetchUserRecipes, fetchFavorites]);

  const handleUsernameUpdate = async () => {
    if (!isOwnProfile) return;
    
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
        // Update profile user to reflect changes immediately
        setProfileUser(prev => prev ? { ...prev, username: newUsername } : null);
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

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!isOwnProfile) return;

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
        // Update profile user to reflect changes immediately
        setProfileUser(prev => prev ? { ...prev, avatarUrl } : null);
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

  if (error) {
    return (
      <div className="min-h-screen bg-bg dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text dark:text-white mb-4">{error}</h1>
          <Button onClick={() => router.push("/")} variant="primary">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !profileUser) {
    return (
      <div className="min-h-screen bg-bg dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!profileUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-accent-light to-secondary-light dark:from-accent/20 dark:to-secondary/20 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {isOwnProfile ? (
              <button
                onClick={() => setShowAvatarModal(true)}
                className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-accent hover:border-accent-hover transition-all hover:scale-105 cursor-pointer group flex-shrink-0"
              >
                {profileUser?.avatarUrl ? (
                  <Image
                    src={profileUser.avatarUrl}
                    alt={profileUser.username || "User avatar"}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized={profileUser.avatarUrl.startsWith('data:')}
                  />
                ) : (
                  <span className="text-4xl font-bold text-bg bg-accent w-full h-full flex items-center justify-center">
                    {profileUser?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Edit className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                </div>
              </button>
            ) : (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-accent flex-shrink-0">
                {profileUser?.avatarUrl ? (
                  <Image
                    src={profileUser.avatarUrl}
                    alt={profileUser.username || "User avatar"}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized={profileUser.avatarUrl.startsWith('data:')}
                  />
                ) : (
                  <span className="text-4xl font-bold text-bg bg-accent w-full h-full flex items-center justify-center">
                    {profileUser?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-text dark:text-white mb-2">
                {profileUser?.username}
              </h1>
              {isOwnProfile && profileUser?.email && (
                <p className="text-text-secondary dark:text-text-muted">{profileUser.email}</p>
              )}
              <p className="text-sm text-text-secondary dark:text-text-muted mt-1">
                Member since {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
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
        <div className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-border dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab("recipes")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === "recipes"
                  ? "text-accent border-b-2 border-accent"
                  : "text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white"
              }`}
            >
              <ChefHat size={20} />
              {isOwnProfile ? "My Recipes" : "Recipes"} ({recipes.length})
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === "favorites"
                      ? "text-accent border-b-2 border-accent"
                      : "text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white"
                  }`}
                >
                  <Heart size={20} />
                  Favorites ({favorites.length})
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === "settings"
                      ? "text-accent border-b-2 border-accent"
                      : "text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white"
                  }`}
                >
                  <Settings size={20} />
                  Settings
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent" size={48} />
          </div>
        ) : (
          <>
            {activeTab === "recipes" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-text dark:text-white">
                    {isOwnProfile ? "Your Recipes" : `${profileUser.username}'s Recipes`}
                  </h2>
                  <div className="flex gap-3 items-center w-full sm:w-auto">
                    {/* Sort Dropdown */}
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as "newest" | "oldest" | "popular")}
                      className="px-4 py-2 border border-border dark:border-gray-700 rounded-lg bg-bg-secondary dark:bg-gray-800 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    {isOwnProfile && (
                      <Button
                        onClick={() => router.push("/recipes/new")}
                        variant="primary"
                      >
                        Create New Recipe
                      </Button>
                    )}
                  </div>
                </div>

                {recipes.length === 0 ? (
                  <div className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                    <ChefHat className="mx-auto mb-4 text-text-muted dark:text-gray-600" size={64} />
                    <h3 className="text-xl font-semibold text-text dark:text-white mb-2">
                      {isOwnProfile ? "No recipes yet" : "No recipes found"}
                    </h3>
                    <p className="text-text-secondary dark:text-text-muted mb-6">
                      {isOwnProfile 
                        ? "Start sharing your culinary creations with the community"
                        : `${profileUser.username} hasn't shared any recipes yet`
                      }
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => router.push("/recipes/new")}
                        variant="primary"
                      >
                        Create Your First Recipe
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
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
                          <h3 className="text-lg font-semibold text-text dark:text-white mb-2">
                            {recipe.title}
                          </h3>
                          <p className="text-sm text-text-secondary dark:text-text-muted mb-4 line-clamp-2">
                            {recipe.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-text-secondary dark:text-text-muted mb-4">
                            <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                            <span>⭐ {recipe.rating > 0 ? recipe.rating : "No ratings"}</span>
                            <span>❤️ {recipe.favoriteCount}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/recipes/${recipe.author?.username || profileUser.username}/${recipe.slug}`)}
                              variant="secondary"
                              className="flex-1"
                            >
                              View
                            </Button>
                            {isOwnProfile && (
                              <Button
                                onClick={() => router.push(`/recipes/edit/${recipe.slug}`)}
                                variant="secondary"
                              >
                                <Edit size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "favorites" && isOwnProfile && (
              <div>
                <h2 className="text-2xl font-bold text-text dark:text-white mb-6">Your Favorite Recipes</h2>

                {favorites.length === 0 ? (
                  <div className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                    <Heart className="mx-auto mb-4 text-text-muted dark:text-gray-600" size={64} />
                    <h3 className="text-xl font-semibold text-text dark:text-white mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-text-secondary dark:text-text-muted mb-6">
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
                        className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/recipes/${recipe.author?.username}/${recipe.slug}`)}
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
                          <h3 className="text-lg font-semibold text-text dark:text-white mb-2">
                            {recipe.title}
                          </h3>
                          <p className="text-sm text-text-secondary dark:text-text-muted mb-4 line-clamp-2">
                            {recipe.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-text-secondary dark:text-text-muted">
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

            {activeTab === "settings" && isOwnProfile && (
              <div className="bg-bg-secondary dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-text dark:text-white mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text dark:text-white mb-2">Profile Information</h3>
                    <div className="bg-bg dark:bg-gray-900 rounded-lg p-4">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-1">
                          Username
                        </label>
                        {editingUsername ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="w-full px-4 py-2 border border-border dark:border-gray-700 rounded-lg bg-bg-secondary dark:bg-gray-800 text-text dark:text-white"
                              placeholder="Enter new username"
                            />
                            {usernameError && (
                              <p className="text-sm text-error">{usernameError}</p>
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
                              value={profileUser?.username || ""}
                              disabled
                              className="flex-1 px-4 py-2 border border-border dark:border-gray-700 rounded-lg bg-bg dark:bg-gray-900 text-text dark:text-white"
                            />
                            <Button
                              onClick={() => {
                                setEditingUsername(true);
                                setNewUsername(profileUser?.username || "");
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
                        <label className="block text-sm font-medium text-text-secondary dark:text-text-muted mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileUser?.email || ""}
                          disabled
                          className="w-full px-4 py-2 border border-border dark:border-gray-700 rounded-lg bg-bg dark:bg-gray-900 text-text dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-text dark:text-white mb-4">Danger Zone</h3>
                    <Button
                      onClick={logout}
                      variant="secondary"
                      className="bg-error/10 text-error hover:bg-error/20"
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
      {showAvatarModal && isOwnProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-secondary dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-text dark:text-white">Select Avatar</h2>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-2 hover:bg-bg dark:hover:bg-gray-700 rounded-full transition"
                aria-label="Close modal"
              >
                <X size={24} className="text-text dark:text-white" />
              </button>
            </div>
            <AvatarPicker
              currentAvatar={profileUser?.avatarUrl || ""}
              onSelect={handleAvatarSelect}
            />
            {saving && (
              <div className="mt-4 text-center text-text-secondary dark:text-text-muted">
                Updating avatar...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
