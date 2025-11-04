import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";
import { log } from "@/lib/logger";

/** Type for AI-parsed recipe (raw output without validation) */
type AIRecipeOutput = Record<string, unknown>;

/** Request validation schema - only validates the request structure */
const RequestBodySchema = z
  .object({
    text: z.string().max(10000).optional(),
    data: z.object({}).catchall(z.any()).optional(),
  })
  .refine((data) => data.text || data.data, {
    message: "Either 'text' or 'data' must be provided",
  });

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/ai/format-recipe
 * Returns raw AI-formatted recipe data without validation
 * Validation is performed on the frontend for UX and backend for security
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate request structure only
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

    let formattedRecipe: AIRecipeOutput;

    if (text) {
      formattedRecipe = await parseRecipeWithOpenAI(text);
    } else if (data) {
      formattedRecipe = await completeRecipeWithAI(data);
    } else {
      return NextResponse.json(
        { error: "Invalid request: 'text' or 'data' must be provided." },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    log.info({ duration, hasRecipe: !!formattedRecipe }, "AI parsing completed");

    return NextResponse.json({ recipe: formattedRecipe, source: "ai" });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error({ 
      duration,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
    }, "Recipe formatting error");
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

/** Parse raw text into structured recipe - returns raw AI output */
async function parseRecipeWithOpenAI(text: string): Promise<AIRecipeOutput> {
  if (!openai) throw new Error("OpenAI client not initialized");

  const prompt = `Parse this recipe into JSON with these fields:

STRUCTURE:
- title, description, servings, prepTimeMinutes, cookTimeMinutes
- calories, proteinG, fatG, carbsG, cuisineName
- difficulty: EASY, MEDIUM, or HARD
- steps: array with stepNumber (number), instruction (string), groupName (string or null), isOptional (boolean)
- ingredients: array with name (string), amount (string or null), unit (string or null), size (string or null), preparation (string or null), notes (string or null), groupName (string or null), displayOrder (number)

IMPORTANT - TYPE REQUIREMENTS:
- Use actual numbers (not strings) for: servings, prepTimeMinutes, cookTimeMinutes, calories, proteinG, fatG, carbsG, stepNumber, displayOrder
- Use actual booleans (not strings) for: isOptional
- Use strings or null for: amount, unit, size, preparation, notes, groupName

INGREDIENT FORMAT:
Each ingredient should have:
- name: ingredient name (e.g., "flour", "eggs")
- amount: numeric quantity as string (e.g., "1", "1/2", "2.5") or null if not applicable
- unit: measurement unit (e.g., "cup", "tbsp", "g", "oz", "pieces") or null if not applicable
- size: descriptor (large, medium, small) or null
- preparation: physical state (diced, melted, sifted) or null
- notes: substitutions/alternatives or null

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
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Expert recipe parser and nutritionist. Extract all information from recipes and provide accurate nutritional estimates. Keep measurements in their original system (no conversion needed). NO tags/categories/allergens. ALWAYS include estimated nutrition values (calories, proteinG, fatG, carbsG) based on ingredients. Return valid JSON only with proper types (numbers as numbers, booleans as booleans, not strings).",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  log.info({ hasRecipe: !!parsed }, "Parsed recipe from AI");
  return parsed;
}

/** Complete partial recipe data - returns raw AI output */
async function completeRecipeWithAI(data: Record<string, unknown>): Promise<AIRecipeOutput> {
  if (!openai) throw new Error("OpenAI client not initialized");

  const prompt = `Complete this recipe with missing fields:
${JSON.stringify(data, null, 2)}

Requirements:
- difficulty: EASY, MEDIUM, or HARD
- steps: array with stepNumber (number), instruction (string), groupName (string or null), isOptional (boolean)
- ingredients with amount and unit (keep original measurement system)
- Estimate missing cuisineName, nutrition, times
- NO tags/categories/allergens

IMPORTANT - TYPE REQUIREMENTS:
- Use actual numbers (not strings) for: servings, prepTimeMinutes, cookTimeMinutes, calories, proteinG, fatG, carbsG, stepNumber, displayOrder
- Use actual booleans (not strings) for: isOptional
- Use strings or null for: amount, unit, size, preparation, notes, groupName

Return complete JSON with proper types (numbers as numbers, booleans as booleans, not strings).`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Recipe validator. Generate missing fields, keep measurements in original system (no conversion). NO tags/categories/allergens. Valid JSON only with proper types (numbers as numbers, booleans as booleans, not strings).",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) throw new Error("Empty response from OpenAI");

  const parsed = parseJSONSafe(result);
  return parsed;
}
