import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";

/**
 * Recipe Formatting API with OpenAI Integration
 * 
 * This endpoint intelligently formats recipes using OpenAI's GPT-4 when an API key is available.
 * If no OpenAI API key is configured (OPENAI_API_KEY env var), it falls back to a simple
 * text parsing implementation that extracts basic recipe information.
 * 
 * To enable OpenAI integration:
 * 1. Sign up for an OpenAI API key at https://platform.openai.com/
 * 2. Set the OPENAI_API_KEY environment variable
 * 3. The endpoint will automatically use GPT-4 for better recipe parsing
 */

interface RecipeIngredient {
  amount: number | null;
  unit: string | null;
  name: string;
  displayOrder: number;
}

interface FormattedRecipe {
  title: string;
  description: string;
  instructions: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  imageUrl?: string;
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
  ingredients: RecipeIngredient[];
  tags: string[];
  categories: string[];
  allergens: string[];
}

// Initialize OpenAI client (will be null if no API key)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/ai/format-recipe
 * Accepts raw text or structured data and returns a formatted recipe object
 * Uses OpenAI if available, falls back to mock implementation
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, data } = body;

    let formattedRecipe: FormattedRecipe;

    if (text) {
      // Parse raw text into structured recipe using AI if available
      if (openai) {
        formattedRecipe = await parseRecipeWithOpenAI(text);
      } else {
        formattedRecipe = parseRecipeText(text);
      }
    } else if (data) {
      // Validate and complete existing recipe data
      if (openai && !data.calories) {
        formattedRecipe = await validateAndCompleteRecipeWithAI(data);
      } else {
        formattedRecipe = validateAndCompleteRecipe(data);
      }
    } else {
      return NextResponse.json(
        { error: "Either 'text' or 'data' must be provided" },
        { status: 400 }
      );
    }

    // Add nutrition data if missing (and not using AI)
    if (!formattedRecipe.calories && !openai) {
      formattedRecipe = addNutritionData(formattedRecipe);
    }

    return NextResponse.json(formattedRecipe);
  } catch (error) {
    console.error("AI format-recipe error:", error);
    return NextResponse.json(
      { error: "Failed to format recipe" },
      { status: 500 }
    );
  }
}

/**
 * Parse recipe text using OpenAI
 */
async function parseRecipeWithOpenAI(text: string): Promise<FormattedRecipe> {
  if (!openai) {
    throw new Error("OpenAI client not initialized");
  }

  const prompt = `Parse the following recipe text and return a JSON object with this exact structure:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "instructions": "Step by step instructions",
  "servings": 4,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 30,
  "calories": 350,
  "proteinG": 25,
  "fatG": 15,
  "carbsG": 40,
  "ingredients": [
    {"amount": 2, "unit": "cups", "name": "flour", "displayOrder": 0}
  ],
  "tags": ["Quick", "Easy"],
  "categories": ["Dinner", "Main Course"],
  "allergens": ["Gluten", "Dairy"]
}

Extract as much information as possible. For nutrition values, provide reasonable estimates based on the ingredients.

Recipe text:
${text}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful recipe parser. Always respond with valid JSON only, no additional text.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(result);
  
  // Ensure ingredients have displayOrder
  if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
    parsed.ingredients = parsed.ingredients.map((ing: RecipeIngredient, index: number) => ({
      ...ing,
      displayOrder: ing.displayOrder ?? index,
    }));
  }

  return parsed as FormattedRecipe;
}

/**
 * Validate and complete recipe with OpenAI (adds nutrition data)
 */
async function validateAndCompleteRecipeWithAI(data: Partial<FormattedRecipe>): Promise<FormattedRecipe> {
  if (!openai) {
    throw new Error("OpenAI client not initialized");
  }

  const prompt = `Given this partial recipe data, add accurate nutrition information (calories, protein, fat, carbs) based on the ingredients and servings. Return the complete recipe as JSON:

${JSON.stringify(data, null, 2)}

Return the same structure with added nutrition fields.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a nutrition expert. Calculate accurate nutrition values based on recipe ingredients. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = completion.choices[0].message.content;
  if (!result) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(result);
  return validateAndCompleteRecipe(parsed);
}

function parseRecipeText(text: string): FormattedRecipe {
  // Simple parser - extracts title, ingredients, and instructions
  const lines = text.split('\n').filter(line => line.trim());
  
  const title = lines[0]?.trim() || "Untitled Recipe";
  const description = lines[1]?.trim() || "A delicious recipe";
  
  // Extract ingredients (lines with measurements)
  const ingredients: RecipeIngredient[] = [];
  // Simplified regex to avoid ReDoS - match unit words more strictly with bounded repetitions
  const ingredientPattern = /^[\d./]{0,10}\s{0,5}(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|piece)s?\s{1,3}(.+)$/i;
  
  let displayOrder = 0;
  for (const line of lines) {
    const match = line.match(ingredientPattern);
    if (match) {
      const [, unit, name] = match;
      const amountMatch = line.match(/^([\d./]+)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
      
      ingredients.push({
        amount,
        unit: unit || null,
        name: name.trim(),
        displayOrder: displayOrder++
      });
    } else if (line.match(/^-\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)) {
      // Bullet or numbered ingredient without measurement
      const ingredientName = line.replace(/^[-\d\.]+\s*/, '').trim();
      if (ingredientName && !ingredientName.toLowerCase().includes('instructions')) {
        ingredients.push({
          amount: null,
          unit: null,
          name: ingredientName,
          displayOrder: displayOrder++
        });
      }
    }
  }
  
  // Extract instructions (numbered or step-by-step lines)
  const instructionLines = lines.filter(line => 
    /^\d+\.\s/.test(line) || 
    line.toLowerCase().includes('step') ||
    (line.length > 30 && !ingredientPattern.test(line))
  );
  const instructions = instructionLines.join('\n') || "No instructions provided";
  
  // Default values - simplified regex to avoid ReDoS
  const servings = extractNumber(text, /(\d{1,3})\s*servings?/i) || 4;
  const prepTimeMinutes = extractNumber(text, /prep[^0-9]{0,20}(\d{1,4})\s*min/i) || 15;
  const cookTimeMinutes = extractNumber(text, /cook[^0-9]{0,20}(\d{1,4})\s*min/i) || 30;
  
  return {
    title,
    description,
    instructions,
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    ingredients: ingredients.length > 0 ? ingredients : [
      { amount: null, unit: null, name: "Ingredient 1", displayOrder: 0 }
    ],
    tags: extractTags(text),
    categories: [],
    allergens: extractAllergens(text)
  };
}

function validateAndCompleteRecipe(data: Partial<FormattedRecipe>): FormattedRecipe {
  // Validate and fill in missing fields
  return {
    title: data.title || "Untitled Recipe",
    description: data.description || "A delicious recipe",
    instructions: data.instructions || "No instructions provided",
    servings: data.servings || 4,
    prepTimeMinutes: data.prepTimeMinutes || 15,
    cookTimeMinutes: data.cookTimeMinutes || 30,
    imageUrl: data.imageUrl,
    ingredients: data.ingredients || [],
    tags: data.tags || [],
    categories: data.categories || [],
    allergens: data.allergens || [],
    calories: data.calories,
    proteinG: data.proteinG,
    fatG: data.fatG,
    carbsG: data.carbsG
  };
}

function addNutritionData(recipe: FormattedRecipe): FormattedRecipe {
  // Simple nutrition estimation based on ingredients count and servings
  const ingredientCount = recipe.ingredients.length;
  const baseCalories = 150 * ingredientCount;
  
  return {
    ...recipe,
    calories: Math.round(baseCalories / recipe.servings),
    proteinG: Math.round((ingredientCount * 8) / recipe.servings),
    fatG: Math.round((ingredientCount * 5) / recipe.servings),
    carbsG: Math.round((ingredientCount * 12) / recipe.servings)
  };
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('chicken') || lowerText.includes('beef') || lowerText.includes('pork')) {
    tags.push('Meat');
  }
  if (lowerText.includes('fish') || lowerText.includes('salmon') || lowerText.includes('seafood')) {
    tags.push('Seafood');
  }
  if (lowerText.includes('vegetarian') || lowerText.includes('vegan')) {
    tags.push('Vegetarian');
  }
  if (lowerText.includes('gluten-free') || lowerText.includes('gluten free')) {
    tags.push('Gluten-Free');
  }
  if (lowerText.includes('quick') || lowerText.includes('easy')) {
    tags.push('Quick & Easy');
  }
  
  return tags;
}

function extractAllergens(text: string): string[] {
  const allergens: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('milk') || lowerText.includes('dairy') || lowerText.includes('cheese') || lowerText.includes('butter')) {
    allergens.push('Dairy');
  }
  if (lowerText.includes('egg')) {
    allergens.push('Eggs');
  }
  if (lowerText.includes('peanut') || lowerText.includes('nut')) {
    allergens.push('Nuts');
  }
  if (lowerText.includes('shellfish') || lowerText.includes('shrimp')) {
    allergens.push('Shellfish');
  }
  if (lowerText.includes('wheat') || lowerText.includes('flour')) {
    allergens.push('Wheat');
  }
  
  return allergens;
}
