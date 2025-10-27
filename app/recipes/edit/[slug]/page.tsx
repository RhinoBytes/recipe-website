"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import Button from "@/components/Button";

interface Ingredient {
  amount: number | null;
  unit: string | null;
  name: string;
  displayOrder: number;
}

interface RecipeFormData {
  title: string;
  description: string;
  instructions: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  imageUrl: string;
  ingredients: Ingredient[];
  tags: string[];
  categories: string[];
  allergens: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Allergen {
  id: string;
  name: string;
}

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    instructions: "",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: "Medium",
    imageUrl: "",
    ingredients: [],
    tags: [],
    categories: [],
    allergens: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    // Fetch recipe data, categories, and allergens
    async function fetchData() {
      try {
        const [recipeRes, categoriesRes, allergensRes] = await Promise.all([
          fetch(`/api/recipes/${slug}`),
          fetch("/api/categories"),
          fetch("/api/allergens"),
        ]);
        
        if (!recipeRes.ok) {
          throw new Error("Recipe not found");
        }

        const recipe = await recipeRes.json();
        
        // Populate form with recipe data
        setFormData({
          title: recipe.title || "",
          description: recipe.description || "",
          instructions: recipe.instructions || "",
          servings: recipe.servings || 4,
          prepTimeMinutes: recipe.prepTimeMinutes || 15,
          cookTimeMinutes: recipe.cookTimeMinutes || 30,
          difficulty: recipe.difficulty || "Medium",
          imageUrl: recipe.imageUrl || "",
          ingredients: recipe.ingredients || [],
          tags: recipe.tags.map((t: { name: string }) => t.name) || [],
          categories: recipe.categories.map((c: { name: string }) => c.name) || [],
          allergens: recipe.allergens.map((a: { name: string }) => a.name) || [],
        });
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
        
        if (allergensRes.ok) {
          const allergensData = await allergensRes.json();
          setAllergens(allergensData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipe");
      } finally {
        setInitialLoading(false);
      }
    }
    
    fetchData();
  }, [slug]);

  const handleFormatWithAI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ai/format-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData }),
      });

      if (!response.ok) {
        throw new Error("Failed to format recipe");
      }

      const formatted = await response.json();
      
      // Update form with AI-formatted data
      setFormData({
        title: formatted.title || formData.title,
        description: formatted.description || formData.description,
        instructions: formatted.instructions || formData.instructions,
        servings: formatted.servings || formData.servings,
        prepTimeMinutes: formatted.prepTimeMinutes || formData.prepTimeMinutes,
        cookTimeMinutes: formatted.cookTimeMinutes || formData.cookTimeMinutes,
        difficulty: formatted.difficulty || formData.difficulty,
        imageUrl: formatted.imageUrl || formData.imageUrl,
        ingredients: formatted.ingredients || formData.ingredients,
        tags: formatted.tags || formData.tags,
        categories: formatted.categories || formData.categories,
        allergens: formatted.allergens || formData.allergens,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to format recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recipes/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update recipe");
      }

      const recipe = await response.json();
      router.push(`/recipes/${recipe.username}/${recipe.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update recipe");
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { amount: null, unit: null, name: "", displayOrder: formData.ingredients.length },
      ],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number | null) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const toggleCategory = (categoryName: string) => {
    if (formData.categories.includes(categoryName)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter(c => c !== categoryName),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, categoryName],
      });
    }
  };

  const toggleAllergen = (allergenName: string) => {
    if (formData.allergens.includes(allergenName)) {
      setFormData({
        ...formData,
        allergens: formData.allergens.filter(a => a !== allergenName),
      });
    } else {
      setFormData({
        ...formData,
        allergens: [...formData.allergens, allergenName],
      });
    }
  };

  if (initialLoading) {
    return (
      <ProtectedPage>
        <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
          <Loader2 className="animate-spin text-amber-600" size={48} />
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Edit Recipe</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Recipe Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Servings, Prep Time, Cook Time */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    value={formData.prepTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    value={formData.cookTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, cookTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Image URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Ingredients</h2>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 mb-3">
                  <input
                    type="number"
                    step="0.01"
                    value={ingredient.amount || ""}
                    onChange={(e) => updateIngredient(index, "amount", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Amount"
                  />
                  <input
                    type="text"
                    value={ingredient.unit || ""}
                    onChange={(e) => updateIngredient(index, "unit", e.target.value || null)}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Unit"
                  />
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Ingredient name"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium"
              >
                <Plus size={18} />
                Add Ingredient
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Instructions</h2>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Write your cooking instructions here..."
                required
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Tags</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Add a tag (e.g., Vegetarian, Quick)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.categories.includes(category.name)
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Allergen Warnings</h2>
              <div className="flex flex-wrap gap-2">
                {allergens.map(allergen => (
                  <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggleAllergen(allergen.name)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.allergens.includes(allergen.name)
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {allergen.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={handleFormatWithAI}
                disabled={loading}
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Formatting...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Format & Validate with AI
                  </>
                )}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  "Update Recipe"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedPage>
  );
}
