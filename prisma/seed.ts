import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  PrismaClient,
  Difficulty,
  RecipeStatus,
  User,
  Media,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import fs from "fs";

// --- Step 1: Explicitly load .env file from the project root ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- Step 2: Add debugging right after loading variables ---
console.log("--- DEBUGGING ENVIRONMENT VARIABLES ---");
const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supKey = process.env.SUPABASE_SERVICE_KEY;
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supUrl || "NOT FOUND"}`);
console.log(
  `SUPABASE_SERVICE_KEY: ${
    supKey ? supKey.slice(0, 5) + "..." + supKey.slice(-5) : "NOT FOUND"
  }`
);
console.log("---------------------------------------");
// --- END OF DEBUGGING BLOCK ---

// --- Step 3: Import Supabase modules AFTER variables are loaded ---
import { uploadImageToSupabase } from "../lib/uploadHelper.js";
import { supabaseAdmin } from "../lib/supabase/server.js";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

type DifficultyType = keyof typeof Difficulty;
type RecipeStatusType = keyof typeof RecipeStatus;

interface RecipeData {
  title: string;
  slug?: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: string;
  sourceUrl?: string;
  sourceText?: string;
  chefNotes?: string;
  cuisine?: string;
  status?: string;
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
  ingredients?: Array<{
    name: string;
    amount?: string;
    unit?: string;
    size?: string;
    preparation?: string;
    notes?: string;
    groupName?: string;
    isOptional?: boolean;
    displayOrder?: number;
  }>;
  steps?: Array<{
    stepNumber: number;
    instruction: string;
    isOptional?: boolean;
  }>;
  tags?: string[];
  categories?: string[];
  allergens?: string[];
  imageUrl?: string;
}

const USER_RECIPE_ASSIGNMENTS: Record<string, string[]> = {
  HomeBaker: [
    "classic-chocolate-chip-cookies",
    "homemade-sourdough-bread",
    "vanilla-cupcakes-buttercream",
    "apple-cinnamon-muffins",
    "lemon-blueberry-scones",
  ],
  TheRealSpiceGirl: [
    "chicken-enchiladas-verde",
    "authentic-street-tacos",
    "homemade-guacamole",
    "mexican-rice",
    "churros-chocolate-sauce",
  ],
  ChefDad: [
    "classic-beef-burger",
    "bbq-ribs",
    "mac-and-cheese",
    "grilled-chicken-caesar-salad",
    "apple-pie",
  ],
};

function readRecipeFolders(): Array<{
  slug: string;
  data: RecipeData;
  folderPath: string;
}> {
  const recipesPath = path.join(__dirname, "seed-data");
  if (!fs.existsSync(recipesPath)) {
    console.log("No seed-data directory found");
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
          console.error(`Error reading recipe JSON for ${folder}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error reading recipe folders:", error);
  }
  return recipes;
}

async function clearExistingData() {
  console.log("Deleting all existing data...");
  const allMedia = await prisma.media.findMany({
    select: {
      publicId: true,
      resourceType: true,
    },
  });
  console.log(
    `Found ${allMedia.length} media files to delete from Supabase...`
  );
  let deletedCount = 0;
  let failedCount = 0;
  for (const media of allMedia) {
    try {
      const { error } = await supabaseAdmin.storage
        .from("recipe-builder")
        .remove([media.publicId]);
      if (error) throw error;
      deletedCount++;
      if (deletedCount % 10 === 0) {
        console.log(
          `  Deleted ${deletedCount}/${allMedia.length} media files...`
        );
      }
    } catch (error) {
      failedCount++;
      console.warn(
        `  Failed to delete ${media.resourceType} ${media.publicId} from storage:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
  if (allMedia.length > 0) {
    console.log(
      `Supabase cleanup complete: ${deletedCount} deleted, ${failedCount} failed`
    );
  }
  await prisma.recipesAllergens.deleteMany({});
  await prisma.recipesCategories.deleteMany({});
  await prisma.recipesTags.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipeIngredient.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.favoriteRecipe.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.allergen.deleteMany({});
  await prisma.cuisine.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("All tables cleared.");
}

async function seedStaticData() {
  console.log("Creating static data...");
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
  await prisma.category.createMany({
    data: categoryNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${categoryNames.length} categories`);
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
  await prisma.tag.createMany({
    data: tagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${tagNames.length} tags`);
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
  await prisma.cuisine.createMany({
    data: cuisineNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${cuisineNames.length} cuisines`);
  const allergenNames = [
    "Vegetarian",
    "Vegan",
    "Dairy Free",
    "Gluten Free",
    "Egg Free",
    "Soy Free",
  ];
  await prisma.allergen.createMany({
    data: allergenNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${allergenNames.length} allergens`);
}

async function createUsers(): Promise<User[]> {
  console.log("Creating seed users...");
  const seedUsernames = ["HomeBaker", "ChefDad", "TheRealSpiceGirl"];
  const users: User[] = [];
  for (const username of seedUsernames) {
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username.toLowerCase()}@example.com`,
        passwordHash: await bcrypt.hash("password123", 10),
        bio: faker.lorem.sentence(),
      },
    });
    users.push(user);
    console.log(`Created user: ${username} (ID: ${user.id})`);
  }
  return users;
}

async function importRecipes(users: User[]) {
  console.log("Reading recipe folders from seed-data...");
  const recipeFolders = readRecipeFolders();
  console.log(`Found ${recipeFolders.length} recipe(s) to import.`);
  const userMap = new Map(users.map((u) => [u.username, u]));
  for (const { slug, data, folderPath } of recipeFolders) {
    console.log(`\nImporting recipe: ${data.title}`);
    try {
      let author: User | undefined = undefined;
      for (const [username, recipeList] of Object.entries(
        USER_RECIPE_ASSIGNMENTS
      )) {
        if (recipeList.includes(slug)) {
          author = userMap.get(username);
          break;
        }
      }
      if (!author) {
        author = faker.helpers.arrayElement(users);
        console.log(
          `  ⚠️  No specific author assigned, using random: ${author.username}`
        );
      } else {
        console.log(`  Author: ${author.username}`);
      }
      let cuisineId: string | null = null;
      if (data.cuisine) {
        const cuisine = await prisma.cuisine.upsert({
          where: { name: data.cuisine },
          update: {},
          create: { name: data.cuisine },
        });
        cuisineId = cuisine.id;
      }
      let media: Media | null = null;
      const imagePath = path.join(folderPath, "image.jpg");
      if (fs.existsSync(imagePath)) {
        console.log(`  Uploading image...`);
        media = await uploadImageToSupabase(
          imagePath,
          "recipe-website/seed",
          author.id,
          false
        );
      }
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
          sourceUrl: data.sourceUrl,
          sourceText: data.sourceText,
          chefNotes: data.chefNotes,
          cuisineId,
          status: (data.status as RecipeStatusType) || RecipeStatus.PUBLISHED,
          calories: data.calories,
          proteinG: data.proteinG,
          fatG: data.fatG,
          carbsG: data.carbsG,
          ingredients: {
            createMany: {
              data: (data.ingredients || []).map((ing, idx: number) => ({
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
            },
          },
          steps: {
            createMany: {
              data: (data.steps || []).map((step) => ({
                stepNumber: step.stepNumber,
                instruction: step.instruction,
                isOptional: step.isOptional || false,
              })),
            },
          },
        },
      });
      if (media) {
        await prisma.media.update({
          where: { id: media.id },
          data: {
            recipeId: recipe.id,
            isPrimary: true,
          },
        });
      }
      if (data.tags?.length) {
        for (const tagName of data.tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          await prisma.recipesTags.create({
            data: { recipeId: recipe.id, tagId: tag.id },
          });
        }
      }
      if (data.categories?.length) {
        for (const categoryName of data.categories) {
          const category = await prisma.category.findUnique({
            where: { name: categoryName },
          });
          if (category) {
            await prisma.recipesCategories.create({
              data: { recipeId: recipe.id, categoryId: category.id },
            });
          }
        }
      }
      if (data.allergens?.length) {
        for (const allergenName of data.allergens) {
          const allergen = await prisma.allergen.findUnique({
            where: { name: allergenName },
          });
          if (allergen) {
            await prisma.recipesAllergens.create({
              data: { recipeId: recipe.id, allergenId: allergen.id },
            });
          }
        }
      }
      const reviewsCount = faker.number.int({ min: 1, max: 3 });
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
      console.log(`  ✓ Successfully imported: ${data.title}`);
    } catch (err) {
      console.error(`  ✗ Failed to import recipe ${data.title}:`, err);
    }
  }
}

async function main() {
  console.log("Seeding database started...\n");
  await clearExistingData();
  await seedStaticData();
  const users = await createUsers();
  await importRecipes(users);
  console.log("\n✅ Seeding finished successfully!");
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
