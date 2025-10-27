// Shared types for recipe forms and AI formatting

export interface RecipeIngredient {
  amount: number | null;
  unit: string | null;
  name: string;
  displayOrder?: number;
}

export interface FormattedRecipeResponse {
  title?: string;
  description?: string;
  instructions?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: string;
  imageUrl?: string;
  cuisineName?: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tags?: string[];
  categories?: string[];
  allergens?: string[];
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  groupName?: string | null;
  isOptional?: boolean;
}
