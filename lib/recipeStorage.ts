import fs from "fs";
import path from "path";

// Type for recipe data structure
interface RecipeData {
  title: string;
  slug: string | null;
  description: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceText: string | null;
  status: string | null;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  cuisine: string | null;
  ingredients: Array<{
    name: string;
    size: string | null;
    preparation: string | null;
    notes: string | null;
    groupName: string | null;
    isOptional: boolean;
    displayOrder: number;
    measurements: Array<{
      system: string;
      amount: string;
      unit: string;
    }>;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    groupName: string | null;
    isOptional: boolean;
  }>;
  tags: string[];
  categories: string[];
  allergens: string[];
}

/**
 * Save recipe data to JSON file in development mode
 * Creates a folder structure: /prisma/data/recipes/{slug}/recipe.json
 */
export async function saveRecipeToFile(
  recipeSlug: string,
  recipeData: RecipeData
): Promise<void> {
  // Only save in development
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    return;
  }

  try {
    const recipeFolderPath = path.join(
      process.cwd(),
      "prisma",
      "data",
      "recipes",
      recipeSlug
    );

    // Create recipe folder if it doesn't exist
    if (!fs.existsSync(recipeFolderPath)) {
      fs.mkdirSync(recipeFolderPath, { recursive: true });
    }

    // Write recipe data to JSON file
    const jsonFilePath = path.join(recipeFolderPath, "recipe.json");
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(recipeData, null, 2),
      "utf-8"
    );

    console.log(`Recipe saved to: ${jsonFilePath}`);
  } catch (error) {
    console.error("Error saving recipe to file:", error);
    // Don't throw - we don't want to fail recipe creation if file save fails
  }
}

/**
 * Save recipe image to folder in development mode
 */
export async function saveRecipeImage(
  recipeSlug: string,
  imageUrl: string
): Promise<void> {
  // Only save in development
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    return;
  }

  // For now, we'll just store the image URL in the JSON
  // In a real implementation, you might download the image
  // This is a placeholder for future image handling
  console.log(
    `Recipe image URL saved in JSON: ${imageUrl} for recipe ${recipeSlug}`
  );
}

/**
 * Read all recipe folders and their JSON files
 */
export function readRecipeFolders(): Array<{ slug: string; data: RecipeData }> {
  const recipesPath = path.join(process.cwd(), "prisma", "data", "recipes");

  // Create directory if it doesn't exist
  if (!fs.existsSync(recipesPath)) {
    fs.mkdirSync(recipesPath, { recursive: true });
    return [];
  }

  const recipes: Array<{ slug: string; data: RecipeData }> = [];

  try {
    const folders = fs
      .readdirSync(recipesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const folder of folders) {
      const jsonPath = path.join(recipesPath, folder, "recipe.json");

      if (fs.existsSync(jsonPath)) {
        try {
          const jsonContent = fs.readFileSync(jsonPath, "utf-8");
          const data = JSON.parse(jsonContent);
          recipes.push({ slug: folder, data });
        } catch (error) {
          console.error(`Error reading recipe JSON for ${folder}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error reading recipe folders:", error);
  }

  return recipes;
}
