import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";
import { Difficulty } from "@prisma/client";

/** Zod Schemas with preprocessing to handle AI quirks */
const RecipeIngredientSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z
    .preprocess(
      (val) => (val == null ? null : String(val)),
      z.string().nullable()
    )
    .optional(),
  unit: z
    .preprocess(
      (val) => (val == null ? null : String(val).toLowerCase()),
      z.string().nullable()
    )
    .optional(),
  size: z
    .preprocess(
      (val) => (val == null ? null : String(val)),
      z.string().nullable()
    )
    .optional(),
  preparation: z
    .preprocess(
      (val) => (val == null ? null : String(val)),
      z.string().nullable()
    )
    .optional(),
  notes: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  isOptional: z.boolean().optional(),
  displayOrder: z.preprocess(
    (val) => (val == null ? 0 : Number(val)),
    z.number().int().min(0)
  ),
});

const RecipeStepSchema = z.object({
  stepNumber: z.preprocess((val) => Number(val ?? 1), z.number().int().min(1)),
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
  instructions: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.join("\n") : String(val ?? "")),
      z.string().min(1)
    )
    .optional(),
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
  difficulty: z.preprocess((val) => {
    if (val == null) return Difficulty.MEDIUM;
    const diffStr = String(val).toUpperCase();
    if (Object.values(Difficulty).includes(diffStr as Difficulty)) {
      return diffStr as Difficulty;
    }
    return Difficulty.MEDIUM;
  }, z.nativeEnum(Difficulty)),
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
    .optional()
    .default([]),
  categories: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map(String) : []),
      z.array(z.string().max(50))
    )
    .optional()
    .default([]),
  allergens: z
    .preprocess(
      (val) => (Array.isArray(val) ? val.map(String) : []),
      z.array(z.string().max(50))
    )
    .optional()
    .default([]),
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
    } else {
      // This else block makes it clear to TypeScript that all paths are handled.
      // Even though zod's .refine should prevent this, it satisfies the compiler.
      return NextResponse.json(
        { error: "Invalid request: 'text' or 'data' must be provided." },
        { status: 400 }
      );
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

  const prompt = `Parse this recipe into JSON with these fields:

STRUCTURE:
- title, description, servings, prepTimeMinutes, cookTimeMinutes
- calories, proteinG, fatG, carbsG, cuisineName
- difficulty: EASY, MEDIUM, or HARD
- steps: array with stepNumber, instruction, groupName (if grouped), isOptional
- ingredients: array with name, amount, unit, size, preparation, notes, groupName, displayOrder

INGREDIENT FORMAT:
Each ingredient should have:
- name: ingredient name (e.g., "flour", "eggs")
- amount: numeric quantity as string (e.g., "1", "1/2", "2.5") - optional if not applicable
- unit: measurement unit (e.g., "cup", "tbsp", "g", "oz", "pieces") - optional if not applicable
- size: descriptor (large, medium, small) - optional
- preparation: physical state (diced, melted, sifted) - optional
- notes: substitutions/alternatives - optional

For counted items (eggs, apples): include amount and unit (e.g., amount: "2", unit: "eggs")
For measured items: include amount and unit in their ORIGINAL measurement system

NUTRITION (REQUIRED):
You MUST estimate nutritional values per serving. Calculate approximate values based on the ingredients:
- calories: total calories per serving (required - estimate if not explicitly stated)
- proteinG: grams of protein per serving (required - estimate if not explicitly stated)
- fatG: grams of fat per serving (required - estimate if not explicitly stated)
- carbsG: grams of carbohydrates per serving (required - estimate if not explicitly stated)

Use your knowledge of common ingredient nutritional values to provide reasonable estimates.

Extract ALL steps from the recipe. NO tags/categories/allergens.

Recipe:
${text}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Expert recipe parser and nutritionist. Extract all information from recipes and provide accurate nutritional estimates. Keep measurements in their original system (no conversion needed). NO tags/categories/allergens. ALWAYS include estimated nutrition values (calories, proteinG, fatG, carbsG) based on ingredients. Return valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  console.log("Parsed recipe from AI:", parsed);
  return RecipeSchema.parse(parsed);
}

/** Complete partial recipe data */
async function completeRecipeWithAI(
  data: Partial<FormattedRecipe>
): Promise<FormattedRecipe> {
  if (!openai) throw new Error("OpenAI client not initialized");

  const prompt = `Complete this recipe with missing fields:
${JSON.stringify(data, null, 2)}

Requirements:
- difficulty: EASY, MEDIUM, or HARD
- steps: array with stepNumber, instruction, groupName, isOptional
- ingredients with amount and unit (keep original measurement system)
- Estimate missing cuisineName, nutrition, times
- NO tags/categories/allergens

Return complete JSON.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Recipe validator. Generate missing fields, keep measurements in original system (no conversion). NO tags/categories/allergens. Valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  return RecipeSchema.parse(parsed);
}
