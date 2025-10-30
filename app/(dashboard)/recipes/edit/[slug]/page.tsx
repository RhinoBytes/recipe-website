"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import ProtectedPage from '@/components/auth/ProtectedPage';
import { Loader2, Upload, AlertCircle } from "lucide-react";
import Button from '@/components/ui/Button';
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { Difficulty, RecipeStatus, MeasurementSystem } from "@prisma/client";
import { parseIngredients, parseSteps, ingredientsToText, stepsToText, convertToNewFormat, ParsedIngredient } from "@/lib/recipeParser";
import { RecipeIngredient as NewRecipeIngredient } from "@/types/recipe";

interface RecipeStep {
  stepNumber: number;
  instruction: string;
  groupName: string | null;
  isOptional: boolean;
}

interface RecipeFormData {
  title: string;
  description: string;
  steps: RecipeStep[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  imageUrl: string;
  sourceUrl: string;
  sourceText: string;
  cuisineName: string;
  ingredients: NewRecipeIngredient[];
  tags: string[];
  categories: string[];
  allergens: string[];
  status: RecipeStatus;
}

interface Category {
  id: string;
  name: string;
}

interface Allergen {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  count?: number;
}

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams() as { slug?: string };
  const slug = params?.slug as string | undefined;
  
  // State for textarea inputs
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    steps: [],
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: Difficulty.MEDIUM,
    imageUrl: "",
    sourceUrl: "",
    sourceText: "",
    cuisineName: "",
    ingredients: [],
    tags: [],
    categories: [],
    allergens: [],
    status: RecipeStatus.PUBLISHED,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  console.log(`formData =`, formData);

  useEffect(() => {
    // Fetch recipe data, categories, and allergens
    async function fetchData() {
      if (!slug) {
        setError("Missing recipe slug");
        setInitialLoading(false);
        return;
      }

      try {
        const [recipeRes, categoriesRes, allergensRes, tagsRes] = await Promise.all([
          fetch(`/api/recipes/${encodeURIComponent(slug)}`),
          fetch("/api/categories"),
          fetch("/api/allergens"),
          fetch("/api/tags"),
        ]);
        
        if (!recipeRes.ok) {
          throw new Error(`Failed to fetch recipe: ${recipeRes.status}`);
        }

        const recipe = await recipeRes.json();
        
        // Helper to map arrays that might be objects with name property
        const toNameArray = (arr: unknown) =>
          Array.isArray(arr)
            ? arr.map((it: { name?: string } | string) => 
                typeof it === "string" ? it : (it.name ?? String(it))
              )
            : [];

        // Normalize ingredients from API response
        const normalizeIngredients = (arr: unknown): ParsedIngredient[] =>
          Array.isArray(arr)
            ? arr.map((ing: {
                name?: string;
                size?: string | null;
                preparation?: string | null;
                notes?: string | null;
                groupName?: string | null;
                isOptional?: boolean;
                displayOrder?: number;
                measurements?: Array<{
                  system: MeasurementSystem;
                  amount: string;
                  unit: string;
                }>;
              }, idx: number) => {
                // Extract first measurement for display
                const firstMeasurement = ing.measurements && ing.measurements[0];
                return {
                  amount: firstMeasurement?.amount || null,
                  unit: firstMeasurement?.unit || null,
                  name: ing.name ?? "",
                  notes: ing.notes ?? null,
                  groupName: ing.groupName ?? null,
                  isOptional: ing.isOptional ?? false,
                  displayOrder: typeof ing.displayOrder === "number" ? ing.displayOrder : idx,
                };
              })
            : [];

        // Normalize steps from API response
        const normalizeSteps = (arr: unknown): RecipeStep[] =>
          Array.isArray(arr)
            ? arr.map((step: {
                stepNumber?: number;
                instruction?: string;
                groupName?: string | null;
                isOptional?: boolean;
              }) => ({
                stepNumber: step.stepNumber ?? 1,
                instruction: step.instruction ?? "",
                groupName: step.groupName ?? null,
                isOptional: step.isOptional ?? false,
              }))
            : [];

        // Normalize difficulty to enum
        let difficultyEnum: Difficulty = Difficulty.MEDIUM;
        if (recipe.difficulty) {
          const upper = String(recipe.difficulty).toUpperCase();
          if (upper === "EASY") difficultyEnum = Difficulty.EASY;
          else if (upper === "HARD") difficultyEnum = Difficulty.HARD;
          else difficultyEnum = Difficulty.MEDIUM;
        }

        // Normalize status to enum
        let statusEnum: RecipeStatus = RecipeStatus.PUBLISHED;
        if (recipe.status) {
          const upper = String(recipe.status).toUpperCase();
          if (upper === "DRAFT") statusEnum = RecipeStatus.DRAFT;
          else statusEnum = RecipeStatus.PUBLISHED;
        }

        const normalizedIngredients = normalizeIngredients(recipe.ingredients);
        const normalizedSteps = normalizeSteps(recipe.steps);

        // Convert to textarea format
        setIngredientsText(ingredientsToText(normalizedIngredients));
        setStepsText(stepsToText(normalizedSteps));

        setFormData({
          title: recipe.title ?? "",
          description: recipe.description ?? "",
          steps: normalizedSteps,
          servings: typeof recipe.servings === "number" ? recipe.servings : 4,
          prepTimeMinutes: typeof recipe.prepTimeMinutes === "number" ? recipe.prepTimeMinutes : 15,
          cookTimeMinutes: typeof recipe.cookTimeMinutes === "number" ? recipe.cookTimeMinutes : 30,
          difficulty: difficultyEnum,
          imageUrl: recipe.imageUrl ?? "",
          sourceUrl: recipe.sourceUrl ?? "",
          sourceText: recipe.sourceText ?? "",
          cuisineName: recipe.cuisine?.name ?? "",
          ingredients: recipe.ingredients || [], // Store full new format with measurements
          tags: toNameArray(recipe.tags),
          categories: toNameArray(recipe.categories),
          allergens: toNameArray(recipe.allergens),
          status: statusEnum,
        });
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
        
        if (allergensRes.ok) {
          const allergensData = await allergensRes.json();
          setAllergens(Array.isArray(allergensData) ? allergensData : []);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAvailableTags(Array.isArray(tagsData) ? tagsData : []);
        }
      } catch (err) {
        console.error("Failed to load recipe:", err);
        setError(err instanceof Error ? err.message : "Failed to load recipe");
      } finally {
        setInitialLoading(false);
      }
    }
    
    fetchData();
  }, [slug]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      if (!slug) throw new Error("Missing slug");

      // Parse textareas into structured data
      const parsedIngredients = parseIngredients(ingredientsText);
      const parsedSteps = parseSteps(stepsText);

      // Validate at least one ingredient and step
      if (parsedIngredients.length === 0) {
        throw new Error("Please add at least one ingredient");
      }
      if (parsedSteps.length === 0) {
        throw new Error("Please add at least one instruction step");
      }

      const submissionData = {
        ...formData,
        ingredients: parsedIngredients.map(ing => convertToNewFormat(ing)),
        steps: parsedSteps,
      };

      const response = await fetch(`/api/recipes/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
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

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmed],
      });
      setTagInput("");
    }
  };

  const toggleTag = (tagName: string) => {
    if (formData.tags.includes(tagName)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => t !== tagName),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagName],
      });
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
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Edit Recipe</h1>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
              <CollapsibleSection title="Basic Information" defaultOpen={true}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe Title <span className="text-red-500">*</span>
                      <span className="ml-2 text-xs text-gray-500">Required</span>
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
                      <span className="ml-2 text-xs text-gray-500">Optional - A brief overview of your recipe</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of your recipe..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servings
                        <span className="ml-2 text-xs text-gray-500">How many people?</span>
                      </label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        min="1"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prep Time (min)
                        <span className="ml-2 text-xs text-gray-500">Setup time</span>
                      </label>
                      <input
                        type="number"
                        value={formData.prepTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        min="0"
                        max="1440"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cook Time (min)
                        <span className="ml-2 text-xs text-gray-500">Active cooking</span>
                      </label>
                      <input
                        type="number"
                        value={formData.cookTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, cookTimeMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        min="0"
                        max="1440"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                      <span className="ml-2 text-xs text-gray-500">How complex is this recipe?</span>
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value={Difficulty.EASY}>Easy - Quick and simple</option>
                      <option value={Difficulty.MEDIUM}>Medium - Some experience helpful</option>
                      <option value={Difficulty.HARD}>Hard - Advanced techniques</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipe Image
                      <span className="ml-2 text-xs text-gray-500">Optional - Add a photo to make your recipe more appealing</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => {
                            setFormData({ ...formData, imageUrl: e.target.value });
                            setImageError(false);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="Enter image URL or upload a file below"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors">
                            <Upload size={18} />
                            <span className="text-sm text-gray-600">
                              {uploadingImage ? "Uploading..." : "Upload Image"}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                      {formData.imageUrl && !imageError && (
                        <div className="mt-2">
                          <Image
                            src={formData.imageUrl}
                            alt="Recipe preview"
                            width={128}
                            height={128}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      )}
                      {imageError && formData.imageUrl && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                          <AlertCircle size={16} />
                          <span>Image failed to load. Using default placeholder.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuisine
                      <span className="ml-2 text-xs text-gray-500">Optional - e.g., Italian, Mexican, Thai</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cuisineName}
                      onChange={(e) => setFormData({ ...formData, cuisineName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., Italian, Mexican, Thai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source URL
                      <span className="ml-2 text-xs text-gray-500">Optional - If adapted from another recipe</span>
                    </label>
                    <input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Text
                      <span className="ml-2 text-xs text-gray-500">Optional - e.g., &ldquo;From Grandma&apos;s cookbook&rdquo;</span>
                    </label>
                    <input
                      type="text"
                      value={formData.sourceText}
                      onChange={(e) => setFormData({ ...formData, sourceText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="e.g., From Grandma's cookbook"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Ingredients */}
              <CollapsibleSection 
                title="Ingredients" 
                defaultOpen={true}
              >
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Enter one ingredient per line.</span> Format: <code className="bg-gray-100 px-1 rounded">amount unit name (notes) optional</code>
                  <br />
                  <span className="text-xs">Examples: <code className="bg-gray-100 px-1 rounded">2 cups flour</code>, <code className="bg-gray-100 px-1 rounded">1/2 cup sugar (or brown sugar) optional</code></span>
                  <br />
                  <span className="text-xs">Group ingredients: <code className="bg-gray-100 px-1 rounded">For the sauce:</code></span>
                </p>
                <textarea
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
                  rows={10}
                  placeholder={`2 cups all-purpose flour\n1/2 cup sugar\n1 tsp baking powder\n\nFor the sauce:\n3 tbsp olive oil\n2 cloves garlic, minced (optional)`}
                  required
                />
              </CollapsibleSection>

              {/* Instructions/Steps */}
              <CollapsibleSection 
                title="Instructions" 
                defaultOpen={true}
              >
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Enter one step per line.</span> Steps will be numbered automatically.
                  <br />
                  <span className="text-xs">Group steps: <code className="bg-gray-100 px-1 rounded">For the cake:</code></span>
                  <br />
                  <span className="text-xs">Mark optional: Add <code className="bg-gray-100 px-1 rounded">(optional)</code> at the end</span>
                </p>
                <textarea
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  rows={12}
                  placeholder={`Preheat oven to 350°F\nMix flour and sugar in a large bowl\n\nFor the sauce:\nHeat oil in a pan\nAdd garlic and cook until fragrant (optional)`}
                  required
                />
              </CollapsibleSection>

              {/* Tags */}
              <CollapsibleSection 
                title="Tags" 
                badge={formData.tags.length || undefined}
                defaultOpen={false}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Select from existing tags or add custom tags to help users find your recipe.
                </p>

                {/* Existing Tags */}
                {availableTags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {availableTags.slice(0, 20).map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            formData.tags.includes(tag.name)
                              ? "border-amber-600 bg-amber-50 text-amber-800 font-medium"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {tag.name}
                          {tag.count && tag.count > 0 && (
                            <span className="ml-1 text-xs opacity-70">({tag.count})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Tag Input */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Custom Tag</h4>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Add a custom tag (e.g., Weeknight Dinner)"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Tags</h4>
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
                            className="hover:text-amber-900 font-bold"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleSection>

              {/* Categories */}
              {categories.length > 0 && (
                <CollapsibleSection 
                  title="Categories" 
                  badge={formData.categories.length || undefined}
                  defaultOpen={false}
                >
                  <p className="text-sm text-gray-600 mb-4">
                    Select one or more categories that best describe your recipe.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.categories.includes(category.name)
                            ? "border-amber-600 bg-amber-50 text-amber-800 font-medium"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Allergens */}
              {allergens.length > 0 && (
                <CollapsibleSection 
                  title="Allergen Warnings" 
                  badge={formData.allergens.length || undefined}
                  defaultOpen={false}
                >
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">Important:</span> Select all allergens present in your recipe to help keep users safe.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((allergen) => (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.name)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.allergens.includes(allergen.name)
                            ? "border-red-600 bg-red-50 text-red-800 font-medium"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {allergen.name}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Submit Actions */}
              <CollapsibleSection 
                title="Save Changes" 
                defaultOpen={true}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Save your recipe as a draft or publish it immediately.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RecipeStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={RecipeStatus.DRAFT}>Save as Draft - Not visible to others</option>
                    <option value={RecipeStatus.PUBLISHED}>Publish Recipe - Visible to everyone</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="primary"
                    className="flex-1 justify-center"
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
                    variant="outline"
                    disabled={loading}
                    className="sm:flex-none"
                  >
                    Cancel
                  </Button>
                </div>
              </CollapsibleSection>
            </form>
        </div>
      </div>
    </ProtectedPage>
  );
}