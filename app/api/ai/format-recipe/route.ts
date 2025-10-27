import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";

/** Zod Schemas with preprocessing to handle AI quirks */
const RecipeIngredientSchema = z.object({
  amount: z.preprocess(
    (val) => (val == null ? null : Number(val)),
    z.number().nullable()
  ),
  unit: z.preprocess(
    (val) => (val == null ? null : String(val)),
    z.string().nullable()
  ),
  name: z.string().min(1).max(200),
  displayOrder: z.preprocess(
    (val, ctx) => (val == null ? 0 : Number(val)),
    z.number().int().min(0)
  ),
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
  ),
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

  const prompt = `Parse this recipe text into JSON with fields:
title, description, instructions, servings, prepTimeMinutes, cookTimeMinutes,
calories, proteinG, fatG, carbsG, ingredients (amount, unit, name, displayOrder),
tags, categories, allergens.
Ensure instructions is a string, servings and nutrition are numbers,
ingredients have amount/unit as number/string, displayOrder starting from 0.
Recipe text:
${text}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a recipe parser and nutritionist. Respond with valid JSON only.",
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
Return JSON with all fields from RecipeSchema. Ensure instructions is a string, servings and nutrition are numbers, ingredients have amount/unit as number/string.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert and recipe validator. Respond with valid JSON only.",
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
