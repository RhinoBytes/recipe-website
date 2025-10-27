"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import Button from "@/components/Button";
import AIRecipeModal from "@/components/ui/AIRecipeModal";
import { FormattedRecipeResponse, RecipeIngredient } from "@/types/recipe";
import { MeasurementUnit, Difficulty, RecipeStatus } from "@prisma/client";

interface Ingredient {
  amount: string | null;
  unit: MeasurementUnit | null;
  name: string;
  notes: string | null;
  groupName: string | null;
  isOptional: boolean;
  displayOrder: number;
}

interface RecipeStep {
  stepNumber: number;
  instruction: string;
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
  ingredients: Ingredient[];
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

export default function NewRecipePage() {
  const router = useRouter();
  const [showAIModal, setShowAIModal] = useState(true); // Show modal on page load
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    steps: [{ stepNumber: 1, instruction: "", isOptional: false }],
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: Difficulty.MEDIUM,
    imageUrl: "",
    sourceUrl: "",
    sourceText: "",
    cuisineName: "",
    ingredients: [{ amount: null, unit: null, name: "", notes: null, groupName: null, isOptional: false, displayOrder: 0 }],
    tags: [],
    categories: [],
    allergens: [],
    status: RecipeStatus.PUBLISHED,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleAIFormattedRecipe = (formatted: FormattedRecipeResponse) => {
    // Convert AI instructions (string) to steps if provided
    const stepsFromInstructions = formatted.instructions
      ? formatted.instructions.split('\n').filter(s => s.trim()).map((instruction, idx) => ({
          stepNumber: idx + 1,
          instruction: instruction.trim(),
          isOptional: false,
        }))
      : [{ stepNumber: 1, instruction: "", isOptional: false }];

    // Convert difficulty string to enum
    let difficultyEnum: Difficulty = Difficulty.MEDIUM;
    if (formatted.difficulty) {
      const upper = formatted.difficulty.toUpperCase();
      if (upper === "EASY") difficultyEnum = Difficulty.EASY as Difficulty;
      else if (upper === "HARD") difficultyEnum = Difficulty.HARD as Difficulty;
      else difficultyEnum = Difficulty.MEDIUM as Difficulty;
    }

    // Update form with AI-formatted data
    setFormData({
      title: formatted.title || "",
      description: formatted.description || "",
      steps: stepsFromInstructions,
      servings: formatted.servings || 4,
      prepTimeMinutes: formatted.prepTimeMinutes || 15,
      cookTimeMinutes: formatted.cookTimeMinutes || 30,
      difficulty: difficultyEnum,
      imageUrl: formatted.imageUrl || "",
      sourceUrl: "",
      sourceText: "",
      cuisineName: "",
      ingredients: formatted.ingredients && formatted.ingredients.length > 0
        ? formatted.ingredients.map((ing: RecipeIngredient, idx: number) => ({
            amount: ing.amount?.toString() || null,
            unit: ing.unit as MeasurementUnit | null,
            name: ing.name,
            notes: null,
            groupName: null,
            isOptional: false,
            displayOrder: idx,
          }))
        : [{ amount: null, unit: null, name: "", notes: null, groupName: null, isOptional: false, displayOrder: 0 }],
      tags: formatted.tags || [],
      categories: formatted.categories || [],
      allergens: formatted.allergens || [],
      status: RecipeStatus.PUBLISHED,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      router.push(`/recipes/${recipe.username}/${recipe.slug}`);
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
        { amount: null, unit: null, name: "", notes: null, groupName: null, isOptional: false, displayOrder: formData.ingredients.length },
      ],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | MeasurementUnit | boolean | null) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { stepNumber: formData.steps.length + 1, instruction: "", isOptional: false },
      ],
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, field: keyof RecipeStep, value: string | boolean) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
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
      <AIRecipeModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onRecipeFormatted={handleAIFormattedRecipe}
      />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Create New Recipe</h1>
            <Button
              variant="secondary"
              onClick={() => setShowAIModal(true)}
            >
              <Sparkles size={18} />
              Use AI Formatter
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

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
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value={Difficulty.EASY}>Easy</option>
                      <option value={Difficulty.MEDIUM}>Medium</option>
                      <option value={Difficulty.HARD}>Hard</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuisine
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
                      Source URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://... (if adapted from another recipe)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Text (Optional)
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
              </div>

              {/* Ingredients */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Ingredients</h2>
                
                <div className="space-y-3">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ingredient.amount || ""}
                          onChange={(e) => updateIngredient(index, "amount", e.target.value || null)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="1/2, 2-3"
                        />
                        <select
                          value={ingredient.unit || ""}
                          onChange={(e) => updateIngredient(index, "unit", e.target.value ? e.target.value as MeasurementUnit : null)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="">None</option>
                          <option value={MeasurementUnit.CUP}>Cup</option>
                          <option value={MeasurementUnit.TBSP}>Tbsp</option>
                          <option value={MeasurementUnit.TSP}>Tsp</option>
                          <option value={MeasurementUnit.FL_OZ}>Fl oz</option>
                          <option value={MeasurementUnit.ML}>mL</option>
                          <option value={MeasurementUnit.L}>L</option>
                          <option value={MeasurementUnit.PINT}>Pint</option>
                          <option value={MeasurementUnit.QUART}>Quart</option>
                          <option value={MeasurementUnit.GALLON}>Gallon</option>
                          <option value={MeasurementUnit.OZ}>oz</option>
                          <option value={MeasurementUnit.LB}>lb</option>
                          <option value={MeasurementUnit.G}>g</option>
                          <option value={MeasurementUnit.KG}>kg</option>
                          <option value={MeasurementUnit.MG}>mg</option>
                          <option value={MeasurementUnit.PIECE}>Piece</option>
                          <option value={MeasurementUnit.WHOLE}>Whole</option>
                          <option value={MeasurementUnit.SLICE}>Slice</option>
                          <option value={MeasurementUnit.CLOVE}>Clove</option>
                          <option value={MeasurementUnit.PINCH}>Pinch</option>
                          <option value={MeasurementUnit.DASH}>Dash</option>
                          <option value={MeasurementUnit.HANDFUL}>Handful</option>
                          <option value={MeasurementUnit.TO_TASTE}>To taste</option>
                          <option value={MeasurementUnit.AS_NEEDED}>As needed</option>
                        </select>
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ingredient.groupName || ""}
                          onChange={(e) => updateIngredient(index, "groupName", e.target.value || null)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                          placeholder="Group (e.g., For the dough)"
                        />
                        <input
                          type="text"
                          value={ingredient.notes || ""}
                          onChange={(e) => updateIngredient(index, "notes", e.target.value || null)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                          placeholder="Notes (e.g., or substitute)"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          <input
                            type="checkbox"
                            checked={ingredient.isOptional}
                            onChange={(e) => updateIngredient(index, "isOptional", e.target.checked)}
                            className="rounded focus:ring-2 focus:ring-amber-500"
                          />
                          Optional
                        </label>
                      </div>
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

              {/* Instructions/Steps */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Instructions</h2>
                
                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-semibold">
                          {step.stepNumber}
                        </div>
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(index, "instruction", e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          rows={3}
                          placeholder="Describe this step..."
                          required
                        />
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 ml-11">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={step.isOptional}
                            onChange={(e) => updateStep(index, "isOptional", e.target.checked)}
                            className="rounded focus:ring-2 focus:ring-amber-500"
                          />
                          Optional step
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addStep}
                  className="mt-4 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Plus size={18} />
                  Add Step
                </button>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RecipeStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={RecipeStatus.DRAFT}>Save as Draft</option>
                    <option value={RecipeStatus.PUBLISHED}>Publish Recipe</option>
                  </select>
                </div>
                <div className="flex gap-4">
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
                      formData.status === RecipeStatus.PUBLISHED ? "Publish Recipe" : "Save Draft"
                    )}
                  </Button>
                </div>
              </div>
            </form>
        </div>
      </div>
    </ProtectedPage>
  );
}
