import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";
import { MeasurementUnit, Difficulty } from "@prisma/client";

/** Zod Schemas with preprocessing to handle AI quirks */
const RecipeIngredientSchema = z.object({
  amount: z.preprocess(
    (val) => (val == null ? null : String(val)),
    z.string().nullable()
  ),
  unit: z.preprocess(
    (val) => {
      if (val == null) return null;
      const unitStr = String(val).toUpperCase().replace(/[- ]/g, '_');
      // Try to match to a MeasurementUnit enum value
      const enumValues = Object.values(MeasurementUnit) as string[];
      if (enumValues.includes(unitStr)) {
        return unitStr;
      }
      return null;
    },
    z.nativeEnum(MeasurementUnit).nullable()
  ),
  name: z.string().min(1).max(200),
  notes: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  isOptional: z.boolean().optional(),
  displayOrder: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().int().min(0)
  ),
});

const RecipeStepSchema = z.object({
  stepNumber: z.preprocess(
    (val) => Number(val ?? 1),
    z.number().int().min(1)
  ),
  instruction: z.string().min(1),
  groupName: z.string().nullable().optional(),
  isOptional: z.boolean().optional(),
});

const RecipeSchema = z.object({
  title: z.preprocess(
    (val) => String(val ?? "Untitled Recipe"),
    z.string().min(1).max(200)
  ),
  description: z.preprocess(
    (val) => String(val ?? "No description"),
    z.string().max(2000)
  ),
  instructions: z.preprocess(
    (val) => (Array.isArray(val) ? val.join("\n") : String(val ?? "")),
    z.string().min(1)
  ).optional(),
  steps: z.array(RecipeStepSchema).optional(),
  servings: z.preprocess(
    (val) => Number(val ?? 1),
    z.number().int().min(1).max(100)
  ),
  prepTimeMinutes: z.preprocess(
    (val) => Number(val ?? 0),
    z.number().int().min(0).max(1440)
  ),
  cookTimeMinutes: z.preprocess(
    (val) => Number(val ?? 0),
    z.number().int().min(0).max(1440)
  ),
  difficulty: z.preprocess(
    (val) => {
      if (val == null) return Difficulty.MEDIUM;
      const diffStr = String(val).toUpperCase();
      if (Object.values(Difficulty).includes(diffStr as Difficulty)) {
        return diffStr as Difficulty;
      }
      return Difficulty.MEDIUM;
    },
    z.nativeEnum(Difficulty)
  ),
  calories: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().int().min(0)
  ),
  proteinG: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().min(0)
  ),
  fatG: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().min(0)
  ),
  carbsG: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().min(0)
  ),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  tags: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map(String) : []),
      z.array(z.string().max(50))
    )
    .optional(),
  categories: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map(String) : []),
      z.array(z.string().max(50))
    )
    .optional(),
  allergens: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map(String) : []),
      z.array(z.string().max(50))
    )
    .optional(),
  cuisineName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceText: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const RequestBodySchema = z
  .object({
    text: z.string().max(10000).optional(),
    data: z.object({}).catchall(z.any()).optional(),
  })
  .refine((data) => data.text || data.data, {
    message: "Either 'text' or 'data' must be provided",
  });

type FormattedRecipe = z.infer<typeof RecipeSchema>;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/ai/format-recipe
 */
export async function POST(request: Request) {
  try {
    // Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate request
    const body = await request.json();
    const validation = RequestBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error?.issues },
        { status: 400 }
      );
    }

    const { text, data } = validation.data;

    if (!openai) {
      return NextResponse.json(
        { error: "AI service not configured. Set OPENAI_API_KEY" },
        { status: 503 }
      );
    }

    let formattedRecipe: FormattedRecipe;

    if (text) {
      formattedRecipe = await parseRecipeWithOpenAI(text);
    } else if (data) {
      formattedRecipe = await completeRecipeWithAI(data);
    }

    return NextResponse.json({ recipe: formattedRecipe, source: "ai" });
  } catch (error) {
    console.error("Recipe formatting error:", error);
    return NextResponse.json(
      {
        error: "Failed to format recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function parseJSONSafe(text: string) {
  // Remove ```json or ``` wrappers and trim
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

/** Parse raw text into structured recipe */
async function parseRecipeWithOpenAI(text: string): Promise<FormattedRecipe> {
  if (!openai) throw new Error("OpenAI client not initialized");

  const prompt = `Parse this recipe text into JSON with ALL of these fields:
title, description, servings, prepTimeMinutes, cookTimeMinutes,
calories, proteinG, fatG, carbsG, cuisineName,
difficulty (must be one of: EASY, MEDIUM, HARD),
steps (array of objects with stepNumber, instruction, groupName, isOptional),
ingredients (array with amount as string like "1/2" or "2-3", unit as one of the MeasurementUnit enums like CUP/TBSP/TSP/etc, name, notes, groupName, isOptional, displayOrder),
tags, categories, allergens.

MeasurementUnit options: CUP, TBSP, TSP, FL_OZ, ML, L, PINT, QUART, GALLON, OZ, LB, G, KG, MG, PIECE, WHOLE, SLICE, CLOVE, PINCH, DASH, HANDFUL, TO_TASTE, AS_NEEDED

CRITICAL REQUIREMENTS:
- ALWAYS extract and include ALL cooking instructions/steps from the recipe text
- steps MUST be an array with stepNumber (1, 2, 3...), instruction (string), groupName (string or null), isOptional (boolean)
- If recipe has grouped steps (e.g., "For the cake:", "For the frosting:"), set groupName accordingly
- If not grouped, leave groupName as null
- ingredients should have groupName set if they're in groups (e.g., "Cake Ingredients", "Frosting Ingredients")
- If cuisineName is not in the recipe, intelligently determine it from the recipe content (e.g., "pasta carbonara" = "Italian", "pad thai" = "Thai")
- If tags are not provided, generate relevant tags based on recipe characteristics (e.g., "quick", "vegetarian", "dessert", "dinner")
- If categories are not provided, determine appropriate categories (e.g., "Main Dish", "Dessert", "Appetizer", "Side Dish")
- If allergens are not explicitly mentioned, identify them from ingredients (e.g., eggs, dairy, nuts, gluten, soy, shellfish, fish)
- difficulty should be EASY, MEDIUM, or HARD based on complexity
- servings and nutrition should be reasonable estimates if not provided
- displayOrder for ingredients starts from 0

Recipe text:
${text}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a recipe parser, nutritionist, and culinary expert. Extract ALL recipe information including instructions. Generate missing cuisine, tags, categories, and allergens based on the recipe content. Respond with valid JSON only. Use exact enum values for difficulty and units.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  return RecipeSchema.parse(parsed); // preprocess ensures everything matches API
}

/** Complete partial recipe data */
async function completeRecipeWithAI(
  data: Partial<FormattedRecipe>
): Promise<FormattedRecipe> {
  if (!openai) throw new Error("OpenAI client not initialized");

  const prompt = `Complete this partial recipe with missing fields and nutrition info based on ingredients:
${JSON.stringify(data, null, 2)}

Return JSON with all required fields. Ensure:
- difficulty is one of: EASY, MEDIUM, HARD
- steps is an array with stepNumber, instruction, groupName, isOptional
- ingredients have amount as string, unit as valid MeasurementUnit enum or null, and groupName if applicable
- If cuisineName is missing, intelligently determine it from the recipe content
- If tags are missing, generate relevant tags based on recipe characteristics
- If categories are missing, determine appropriate categories
- If allergens are missing, identify them from ingredients
- servings and nutrition are numbers`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert, recipe validator, and culinary expert. Generate missing metadata (cuisine, tags, categories, allergens) intelligently based on recipe content. Respond with valid JSON only. Use exact enum values.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  return RecipeSchema.parse(parsed); // preprocess fixes AI inconsistencies
}
