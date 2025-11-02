import { PrismaClient, Difficulty, RecipeStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { readRecipeFolders } from "../lib/recipeStorage.js";
import bcrypt from "bcrypt";
import {
  getRandomProfileAvatar,
  getRandomRecipePlaceholder,
} from "../lib/placeholders.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

type DifficultyType = keyof typeof Difficulty;
type RecipeStatusType = keyof typeof RecipeStatus;

// Helper function to copy image file
async function copyRecipeImage(
  sourceImagePath: string,
  recipeId: string
): Promise<string | null> {
  try {
    // Create the target directory if it doesn't exist
    const targetDir = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "recipes",
      recipeId
    );

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Get the file extension from the source image
    const ext = path.extname(sourceImagePath);
    const targetFileName = `image${ext}`;
    const targetPath = path.join(targetDir, targetFileName);

    // Copy the file
    fs.copyFileSync(sourceImagePath, targetPath);

    // Return the public URL path
    return `/uploads/recipes/${recipeId}/${targetFileName}`;
  } catch (error) {
    console.error(`Failed to copy image: ${error}`);
    return null;
  }
}

async function main() {
  console.log("Seeding database started...");

  // --- DELETE EXISTING DATA ---
  console.log("Deleting all existing data...");

  // Delete child tables first to avoid foreign key constraints
  await prisma.recipesAllergens.deleteMany({});
  await prisma.recipesCategories.deleteMany({});
  await prisma.recipesTags.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipeIngredient.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.allergen.deleteMany({});
  await prisma.cuisine.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("All tables cleared.");

  // Clean up old recipe uploads folder
  const uploadsDir = path.join(__dirname, "..", "public", "uploads", "recipes");
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    console.log("Cleaned up old recipe uploads folder.");
  }

  // --- CREATE USERS ---
  console.log("Creating seed users...");
  const seedUsernames = ["HomeBaker", "ChefDad", "TheRealSpiceGirl"];
  const users = [];

  for (const username of seedUsernames) {
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username.toLowerCase()}@example.com`,
        passwordHash: await bcrypt.hash("password123", 10),
        avatarUrl: getRandomProfileAvatar(),
        bio: faker.lorem.sentence(),
      },
    });
    users.push(user);
    console.log(`Created user: ${username} (ID: ${user.id})`);
  }

  // --- CREATE CATEGORIES ---
  console.log("Creating categories...");
  const categoryNames = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Appetizer / Starter",
    "Snack",
    "Dessert",
    "Beverage / Drink",
    "Sauce / Condiment",
    "Salad",
    "Soup",
    "Bread / Baking",
    "Side Dish",
  ];
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Categories seeded successfully.");

  // --- CREATE TAGS ---
  console.log("Creating tags...");
  const tagNames = [
    "Dairy-Free",
    "Low-Carb",
    "Easy",
    "Quick",
    "One-Pot",
    "Air Fryer",
    "Kid-Friendly",
    "Family-Friendly",
    "Party / Entertaining",
    "Comfort Food",
  ];
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Tags seeded successfully.");

  // --- CREATE CUISINES ---
  console.log("Creating cuisines...");
  const cuisineNames = [
    "American",
    "Italian",
    "Mexican",
    "French",
    "Chinese",
    "Japanese",
    "Thai",
    "Indian",
    "Mediterranean",
    "Middle Eastern",
    "Korean",
    "Vietnamese",
    "Spanish",
    "Greek",
    "Moroccan",
    "Caribbean",
    "German",
    "British / English",
    "Brazilian",
    "African",
  ];
  for (const name of cuisineNames) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Cuisines seeded successfully.");

  // --- CREATE ALLERGENS ---
  console.log("Creating allergens...");
  const allergenNames = [
    "Vegetarian",
    "Vegan",
    "Dairy Free",
    "Gluten Free",
    "Egg Free",
    "Soy Free",
  ];
  const allergens = [];
  for (const name of allergenNames) {
    const allergen = await prisma.allergen.create({ data: { name } });
    allergens.push(allergen);
    console.log(`Created allergen: ${name} (ID: ${allergen.id})`);
  }

  // --- READ RECIPE JSON FILES ---
  console.log("Reading recipe folders...");
  const recipeFolders = readRecipeFolders() || [];
  console.log(`Found ${recipeFolders.length} recipe(s) to import.`);

  // --- IMPORT JSON RECIPES ---
  for (const { slug, data, folderPath } of recipeFolders) {
    console.log(`Importing recipe: ${data.title}`);
    try {
      const author = faker.helpers.arrayElement(users);

      let cuisineId: string | null = null;
      if (data.cuisine) {
        let cuisine = await prisma.cuisine.findUnique({
          where: { name: data.cuisine },
        });
        if (!cuisine) {
          cuisine = await prisma.cuisine.create({
            data: { name: data.cuisine },
          });
          console.log(`Created cuisine: ${cuisine.name}`);
        }
        cuisineId = cuisine.id;
      }

      // Create recipe first to get the ID
      const recipe = await prisma.recipe.create({
        data: {
          authorId: author.id,
          title: data.title,
          slug: data.slug || slug,
          description: data.description,
          servings: data.servings,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          difficulty: (data.difficulty as DifficultyType) || Difficulty.MEDIUM,
          imageUrl: data.imageUrl || getRandomRecipePlaceholder(),
          sourceUrl: data.sourceUrl,
          sourceText: data.sourceText,
          cuisineId,
          status: (data.status as RecipeStatusType) || RecipeStatus.PUBLISHED,
          calories: data.calories,
          proteinG: data.proteinG,
          fatG: data.fatG,
          carbsG: data.carbsG,
        },
      });

      // Handle image copying if there's a local image file
      if (folderPath) {
        let sourceImagePath: string | null = null;

        // If imageUrl is provided and is a local path (not a URL)
        if (data.imageUrl && !data.imageUrl.startsWith("http")) {
          sourceImagePath = path.join(folderPath, data.imageUrl);
          console.log(`  Checking for image: ${data.imageUrl}`);
        }
        // If no imageUrl or empty string, search for image files in the folder
        else if (!data.imageUrl || data.imageUrl === "") {
          console.log(`  No imageUrl specified, searching for image files...`);
          const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
          const files = fs.readdirSync(folderPath);

          for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
              sourceImagePath = path.join(folderPath, file);
              console.log(`  Found image file: ${file}`);
              break;
            }
          }
        }

        // If we found an image path, try to copy it
        if (sourceImagePath) {
          console.log(`  Looking for image at: ${sourceImagePath}`);

          if (fs.existsSync(sourceImagePath)) {
            console.log(`  Image found! Copying...`);
            const newImageUrl = await copyRecipeImage(
              sourceImagePath,
              recipe.id
            );

            if (newImageUrl) {
              // Update the recipe with the new image URL
              await prisma.recipe.update({
                where: { id: recipe.id },
                data: { imageUrl: newImageUrl },
              });
              console.log(`  ✓ Copied image to ${newImageUrl}`);
            } else {
              console.log(`  ✗ Failed to copy image`);
            }
          } else {
            console.log(`  ✗ Image file not found at path: ${sourceImagePath}`);
          }
        } else {
          console.log(`  No image file found in folder`);
        }
      }

      // Ingredients
      if (data.ingredients?.length) {
        await prisma.recipeIngredient.createMany({
          data: data.ingredients.map((ing, idx) => ({
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount || null,
            unit: ing.unit || null,
            size: ing.size || null,
            preparation: ing.preparation || null,
            notes: ing.notes || null,
            groupName: ing.groupName || null,
            isOptional: ing.isOptional || false,
            displayOrder: ing.displayOrder ?? idx,
          })),
        });
      }

      // Steps
      if (data.steps?.length) {
        await prisma.recipeStep.createMany({
          data: data.steps.map((step) => ({
            recipeId: recipe.id,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            isOptional: step.isOptional || false,
          })),
        });
      }

      // Tags
      if (data.tags?.length) {
        for (const tagName of data.tags) {
          let tag = await prisma.tag.findUnique({ where: { name: tagName } });
          if (!tag) tag = await prisma.tag.create({ data: { name: tagName } });
          await prisma.recipesTags.create({
            data: { recipeId: recipe.id, tagId: tag.id },
          });
        }
      }

      // Categories
      if (data.categories?.length) {
        for (const categoryName of data.categories) {
          const category = await prisma.category.findUnique({
            where: { name: categoryName },
          });
          if (category)
            await prisma.recipesCategories.create({
              data: { recipeId: recipe.id, categoryId: category.id },
            });
        }
      }

      // Allergens
      if (data.allergens?.length) {
        for (const allergenName of data.allergens) {
          const allergen = await prisma.allergen.findUnique({
            where: { name: allergenName },
          });
          if (allergen)
            await prisma.recipesAllergens.create({
              data: { recipeId: recipe.id, allergenId: allergen.id },
            });
        }
      }

      const reviewsCount = faker.number.int({ min: 1, max: 3 }); // min is now 1
      for (let r = 0; r < reviewsCount; r++) {
        const reviewer = faker.helpers.arrayElement(users);
        await prisma.review.create({
          data: {
            recipeId: recipe.id,
            userId: reviewer.id,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence(),
          },
        });
      }

      console.log(`✓ Imported recipe: ${data.title}`);
    } catch (err) {
      console.error(`✗ Failed to import recipe ${data.title}:`, err);
    }
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Database connection closed.");
  });
