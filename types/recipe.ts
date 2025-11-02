// Shared types for recipe forms and API communication

import { Difficulty, RecipeStatus } from "@prisma/client";

// Ingredient interface used across all recipe forms and APIs
export interface RecipeIngredient {
  name: string;
  amount?: string | null;
  unit?: string | null;
  size?: string | null;
  preparation?: string | null;
  notes?: string | null;
  groupName?: string | null;
  isOptional?: boolean;
  displayOrder?: number;
}

// Recipe step interface used across all recipe forms and APIs
export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  groupName?: string | null;
  isOptional?: boolean;
}

// Form data structure for creating and editing recipes
export interface RecipeFormData {
  title: string;
  description: string;
  steps: RecipeStep[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  source: string;
  chefNotes: string;
  cuisineName: string;
  ingredients: RecipeIngredient[];
  tags: string[];
  categories: string[];
  allergens: string[];
  status: RecipeStatus;
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
}

// Response from AI formatting endpoint
export interface FormattedRecipeResponse {
  title?: string;
  description?: string;
  instructions?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: string;
  cuisineName?: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: string[];
  categories?: string[];
  allergens?: string[];
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
}

// Type for recipe data structure stored in JSON files (seeds)
export interface RecipeData {
  title: string;
  slug: string | null;
  description: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: string | null;
  sourceUrl: string | null;
  sourceText: string | null;
  status: string | null;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  cuisine: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: string[];
  categories: string[];
  allergens: string[];
}
