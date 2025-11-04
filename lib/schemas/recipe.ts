import { z } from "zod";
import { Difficulty, RecipeStatus } from "@prisma/client";

/**
 * Shared Zod schemas for recipe validation
 * Used by both frontend (for UX) and backend (for security)
 */

/** Recipe Ingredient Schema */
export const RecipeIngredientSchema = z.object({
  name: z
    .string()
    .min(1, "Ingredient name is required")
    .max(200, "Ingredient name is too long"),
  amount: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  unit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val?.toLowerCase() ?? null)),
  size: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  preparation: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  notes: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  isOptional: z.coerce.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

/** Recipe Step Schema */
export const RecipeStepSchema = z.object({
  stepNumber: z.coerce
    .number({ message: "Step number must be a number" })
    .int()
    .min(1, "Step number must be at least 1"),
  instruction: z.string().min(1, "Step instruction is required"),
  groupName: z.string().nullable().optional(),
  isOptional: z.coerce.boolean().optional().default(false),
});

/** Main Recipe Schema */
export const RecipeSchema = z.object({
  title: z
    .string()
    .min(1, "Recipe title is required")
    .max(200, "Recipe title is too long"),
  description: z
    .string()
    .max(2000, "Description is too long")
    .default("No description"),
  instructions: z.string().optional(),
  steps: z
    .array(RecipeStepSchema)
    .min(1, "At least one step is required")
    .optional(),
  servings: z.coerce
    .number({ message: "Servings must be a number" })
    .int()
    .min(1, "At least 1 serving required")
    .max(100, "Maximum 100 servings allowed")
    .default(1),
  prepTimeMinutes: z.coerce
    .number({ message: "Prep time must be a number" })
    .int()
    .min(0, "Prep time cannot be negative")
    .max(1440, "Prep time too long (max 24 hours)")
    .default(0),
  cookTimeMinutes: z.coerce
    .number({ message: "Cook time must be a number" })
    .int()
    .min(0, "Cook time cannot be negative")
    .max(1440, "Cook time too long (max 24 hours)")
    .default(0),
  difficulty: z
    .nativeEnum(Difficulty, {
      message: "Difficulty must be EASY, MEDIUM, or HARD",
    })
    .default(Difficulty.MEDIUM),
  calories: z.coerce
    .number()
    .int()
    .min(0, "Calories cannot be negative")
    .optional()
    .default(0),
  proteinG: z.coerce
    .number()
    .min(0, "Protein cannot be negative")
    .optional()
    .default(0),
  fatG: z.coerce
    .number()
    .min(0, "Fat cannot be negative")
    .optional()
    .default(0),
  carbsG: z.coerce
    .number()
    .min(0, "Carbs cannot be negative")
    .optional()
    .default(0),
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(1, "At least one ingredient is required"),
  tags: z.array(z.string().max(50, "Tag name is too long")).optional().default([]),
  categories: z.array(z.string().max(50, "Category name is too long")).optional().default([]),
  allergens: z.array(z.string().max(50, "Allergen name is too long")).optional().default([]),
  cuisineName: z.string().optional(),
  sourceUrl: z.string().url("Invalid URL format").optional(),
  sourceText: z.string().optional(),
  imageUrl: z.string().url("Invalid URL format").optional(),
  chefNotes: z.string().optional(),
  status: z.nativeEnum(RecipeStatus).optional(),
});

/** Type exports for TypeScript */
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type RecipeStep = z.infer<typeof RecipeStepSchema>;
