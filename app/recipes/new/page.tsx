"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewRecipePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "paste">("manual");
  const [pasteText, setPasteText] = useState("");
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    instructions: "",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: "Medium",
    imageUrl: "",
    ingredients: [{ amount: null, unit: null, name: "", displayOrder: 0 }],
    tags: [],
    categories: [],
    allergens: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiFormatted, setAiFormatted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    // Fetch categories and allergens
    async function fetchData() {
      try {
        const [categoriesRes, allergensRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/allergens"),
        ]);
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
        
        if (allergensRes.ok) {
          const allergensData = await allergensRes.json();
          setAllergens(allergensData);
        }
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      }
    }
    
    fetchData();
  }, []);

  const handleFormatWithAI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = mode === "paste" 
        ? { text: pasteText }
        : { data: formData };
      
      const response = await fetch("/api/ai/format-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to format recipe");
      }

      const formatted = await response.json();
      
      // Update form with AI-formatted data
      setFormData({
        title: formatted.title || "",
        description: formatted.description || "",
        instructions: formatted.instructions || "",
        servings: formatted.servings || 4,
        prepTimeMinutes: formatted.prepTimeMinutes || 15,
        cookTimeMinutes: formatted.cookTimeMinutes || 30,
        difficulty: formatted.difficulty || "Medium",
        imageUrl: formatted.imageUrl || "",
        ingredients: formatted.ingredients || [],
        tags: formatted.tags || [],
        categories: formatted.categories || [],
        allergens: formatted.allergens || [],
      });
      
      setAiFormatted(true);
      setMode("manual"); // Switch to manual mode to allow editing
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to format recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiFormatted) {
      setError("Please format your recipe with AI before submitting");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create recipe");
      }

      const recipe = await response.json();
      router.push(`/recipes/${recipe.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recipe");
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

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Create New Recipe</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="bg-white rounded-lg shadow-sm p-2 mb-6 flex gap-2">
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === "manual"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setMode("paste")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === "paste"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paste & Format
            </button>
          </div>

          {/* Paste Mode */}
          {mode === "paste" && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Your Recipe
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Paste your recipe here... Include title, ingredients, instructions, and any other details."
              />
              <Button
                onClick={handleFormatWithAI}
                disabled={loading || !pasteText.trim()}
                className="mt-4"
                variant="primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Formatting...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Format Recipe with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Manual Entry Form */}
          {mode === "manual" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Honey Garlic Glazed Salmon"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of your recipe..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Ingredients</h2>
                
                <div className="space-y-3">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={ingredient.amount || ""}
                        onChange={(e) => updateIngredient(index, "amount", parseFloat(e.target.value) || null)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Amt"
                      />
                      <input
                        type="text"
                        value={ingredient.unit || ""}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value || null)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Unit"
                      />
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Ingredient name"
                        required
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addIngredient}
                  className="mt-4 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Plus size={18} />
                  Add Ingredient
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Instructions</h2>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={8}
                  placeholder="Step-by-step instructions..."
                  required
                />
              </div>

              {/* Tags */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Tags</h2>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-amber-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.categories.includes(category.name)
                            ? "border-amber-600 bg-amber-50 text-amber-800"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {allergens.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Allergens</h2>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((allergen) => (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.name)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.allergens.includes(allergen.name)
                            ? "border-red-600 bg-red-50 text-red-800"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {allergen.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-4">
                  {!aiFormatted && (
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
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading || !aiFormatted}
                    variant="primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Publishing...
                      </>
                    ) : (
                      "Publish Recipe"
                    )}
                  </Button>
                </div>
                
                {!aiFormatted && (
                  <p className="text-sm text-gray-600 mt-2">
                    You must format and validate your recipe with AI before publishing.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
