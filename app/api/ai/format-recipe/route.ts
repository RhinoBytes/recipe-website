import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";
import { Difficulty, MeasurementSystem } from "@prisma/client";

/** Zod Schemas with preprocessing to handle AI quirks */
const MeasurementSchema = z.object({
  system: z.nativeEnum(MeasurementSystem),
  amount: z.preprocess(
    (val) => (val == null ? "" : String(val)),
    z.string().min(1)
  ),
  unit: z.preprocess(
    (val) => (val == null ? "" : String(val).toLowerCase()),
    z.string().min(1)
  ),
});

const RecipeIngredientSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.preprocess(
    (val) => (val == null ? null : String(val)),
    z.string().nullable()
  ).optional(),
  preparation: z.preprocess(
    (val) => (val == null ? null : String(val)),
    z.string().nullable()
  ).optional(),
  notes: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  isOptional: z.boolean().optional(),
  displayOrder: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().int().min(0)
  ),
  measurements: z.array(MeasurementSchema).min(1),
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
ingredients (array with name, size (e.g., "large", "medium"), preparation (e.g., "diced", "melted", "sifted"), notes (for substitutions/options), groupName, isOptional, displayOrder, and measurements array),
tags, categories, allergens.

**CRITICAL MEASUREMENT SYSTEM REQUIREMENTS:**
You are an expert unit converter. Each ingredient MUST have a "measurements" array containing BOTH measurement systems:

1. measurements array structure:
   - system: "IMPERIAL", "METRIC", or "OTHER"
   - amount: string (e.g., "1", "1/2", "2-3")
   - unit: string (e.g., "cup", "g", "ml", "tbsp")

2. If the recipe provides IMPERIAL units (cup, oz, lb, tbsp, tsp, fl oz):
   - Parse the original imperial measurement
   - ALSO generate the accurate METRIC equivalent (g, ml, l)
   - Add both to the measurements array

3. If the recipe provides METRIC units (g, kg, ml, l):
   - Parse the original metric measurement
   - ALSO generate the accurate IMPERIAL equivalent (cup, oz, tbsp, tsp)
   - Add both to the measurements array

4. For non-standard units (whole, piece, clove, pinch, dash, to taste, as needed):
   - Use system: "OTHER"
   - Only include ONE measurement with this unit

5. Common conversions to use:
   - 1 cup = 240ml (liquid) or varies by ingredient (flour ~120g, sugar ~200g)
   - 1 tbsp = 15ml
   - 1 tsp = 5ml
   - 1 oz (weight) = 28g
   - 1 lb = 454g
   - 1 fl oz = 30ml

**PREPARATION vs NOTES DISTINCTION:**
- preparation: Physical state or preparation method of the ingredient itself (e.g., "diced", "chopped", "melted", "softened", "at room temperature", "sifted", "beaten")
- notes: Substitutions, alternatives, optional variations (e.g., "can use almond milk", "dairy-free option available", "or use brown sugar")

**size field:** Physical descriptor of the ingredient (e.g., "large", "medium", "small") - goes in size field, NOT preparation.

CRITICAL REQUIREMENTS:
- ALWAYS extract and include ALL cooking instructions/steps from the recipe text
- steps MUST be an array with stepNumber (1, 2, 3...), instruction (string), groupName (string or null), isOptional (boolean)
- If recipe has grouped steps (e.g., "For the cake:", "For the frosting:"), set groupName accordingly
- If not grouped, leave groupName as null
- ingredients should have groupName set if they're in groups (e.g., "Cake Ingredients", "Frosting Ingredients")
- If cuisineName is not in the recipe, intelligently determine it from the recipe content
- If tags are not provided, generate relevant tags based on recipe characteristics
- If categories are not provided, determine appropriate categories
- If allergens are not explicitly mentioned, identify them from ingredients
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
          "You are an expert recipe parser, nutritionist, culinary expert, and unit conversion specialist. Extract ALL recipe information including instructions. Generate missing cuisine, tags, categories, and allergens. CRITICALLY: For each ingredient, generate BOTH Imperial and Metric measurements with accurate conversions. Distinguish between preparation methods (goes in preparation field) and substitution notes (goes in notes field). Respond with valid JSON only.",
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
- ingredients have:
  - name (required)
  - size (e.g., "large", "medium", optional)
  - preparation (e.g., "diced", "melted", optional)
  - notes (for substitutions/options, optional)
  - groupName (optional)
  - measurements array with BOTH Imperial and Metric conversions:
    * system: "IMPERIAL", "METRIC", or "OTHER"
    * amount: string (e.g., "1", "1/2")
    * unit: string (e.g., "cup", "g", "ml")
- If cuisineName is missing, intelligently determine it from the recipe content
- If tags are missing, generate relevant tags based on recipe characteristics
- If categories are missing, determine appropriate categories
- If allergens are missing, identify them from ingredients
- servings and nutrition are numbers

CRITICAL: Generate accurate unit conversions between Imperial and Metric systems for all ingredients.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert, recipe validator, culinary expert, and unit conversion specialist. Generate missing metadata intelligently. CRITICALLY: For each ingredient, provide BOTH Imperial and Metric measurements with accurate conversions. Respond with valid JSON only.",
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
