import fs from "fs";
import path from "path";
import type { RecipeData } from "@/types/recipe";

import { log } from "@/lib/logger";
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

    log.info({ jsonFilePath }, "Recipe saved to file");
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Error saving recipe to file");
    // Don't throw - we don't want to fail recipe creation if file save fails
  }
}

/**
 * Save recipe image to folder in development mode
 * Copies image from public/uploads/recipes/{recipeId}/ to prisma/data/recipes/{slug}/
 */
export async function saveRecipeImage(
  recipeSlug: string,
  imageUrl: string
): Promise<void> {
  // Only save in development
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    return;
  }

  try {
    // Check if imageUrl is a local upload path
    if (!imageUrl || imageUrl.startsWith("http")) {
      log.info({ imageUrl }, "Skipping image save - not a local upload");
      return;
    }

    // Construct source path from imageUrl (e.g., /uploads/recipes/{id}/image.jpg)
    const sourceImagePath = path.join(process.cwd(), "public", imageUrl);

    if (!fs.existsSync(sourceImagePath)) {
      log.warn({ sourceImagePath }, "Source image not found");
      return;
    }

    // Create recipe folder
    const recipeFolderPath = path.join(
      process.cwd(),
      "prisma",
      "data",
      "recipes",
      recipeSlug
    );

    if (!fs.existsSync(recipeFolderPath)) {
      fs.mkdirSync(recipeFolderPath, { recursive: true });
    }

    // Get filename from source path
    const fileName = path.basename(sourceImagePath);
    const targetImagePath = path.join(recipeFolderPath, fileName);

    // Copy the image file
    fs.copyFileSync(sourceImagePath, targetImagePath);

    log.info({ targetImagePath }, "Recipe image copied");
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Error saving recipe image");
  }
}

/**
 * Read all recipe folders and their JSON files
 * This version is used by API routes for runtime recipe management in development.
 * For database seeding, see prisma/seed.ts
 */
export function readRecipeFolders(): Array<{
  slug: string;
  data: RecipeData;
  folderPath: string;
}> {
  const recipesPath = path.join(process.cwd(), "prisma", "data", "recipes");

  // Create directory if it doesn't exist
  if (!fs.existsSync(recipesPath)) {
    fs.mkdirSync(recipesPath, { recursive: true });
    return [];
  }

  const recipes: Array<{
    slug: string;
    data: RecipeData;
    folderPath: string;
  }> = [];

  try {
    const folders = fs
      .readdirSync(recipesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const folder of folders) {
      const folderPath = path.join(recipesPath, folder);
      const jsonPath = path.join(folderPath, "recipe.json");

      if (fs.existsSync(jsonPath)) {
        try {
          const jsonContent = fs.readFileSync(jsonPath, "utf-8");
          const data = JSON.parse(jsonContent);
          recipes.push({
            slug: folder,
            data,
            folderPath,
          });
        } catch (error) {
          log.error({ folder, error: error instanceof Error ? { message: error.message } : String(error) }, "Error reading recipe JSON");
        }
      }
    }
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Error reading recipe folders");
  }

  return recipes;
}
