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
  await prisma.recipesCuisines.deleteMany({});
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
  
  // Create new tags
  const tagNames = [
    "Quick & Easy",
    "Family-Friendly",
    "Freezer-Friendly",
    "One-Pot Meal",
    "Batch Cooking",
    "Spicy",
    "Healthy",
    "Comfort Food",
    "Budget-Friendly",
    "Gourmet",
  ];
  await prisma.tag.createMany({
    data: tagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${tagNames.length} tags`);

  // Create hierarchical cuisines
  console.log("Creating hierarchical cuisines...");
  
  // Parent cuisines
  const african = await prisma.cuisine.create({ data: { name: "African" } });
  const american = await prisma.cuisine.create({ data: { name: "American" } });
  const asian = await prisma.cuisine.create({ data: { name: "Asian" } });
  const european = await prisma.cuisine.create({ data: { name: "European" } });
  const middleEastern = await prisma.cuisine.create({ data: { name: "Middle Eastern" } });
  const oceanian = await prisma.cuisine.create({ data: { name: "Oceanian / Pacific" } });

  // African children
  await prisma.cuisine.createMany({
    data: [
      { name: "North African (Moroccan, Egyptian)", parentId: african.id },
      { name: "West African (Nigerian, Ghanaian)", parentId: african.id },
      { name: "East African (Ethiopian)", parentId: african.id },
    ],
  });

  // American children
  await prisma.cuisine.createMany({
    data: [
      { name: "North American (American, Mexican, Canadian)", parentId: american.id },
      { name: "Caribbean (Jamaican, Cuban)", parentId: american.id },
      { name: "South American (Peruvian, Brazilian, Argentinian)", parentId: american.id },
    ],
  });

  // Asian children
  await prisma.cuisine.createMany({
    data: [
      { name: "East Asian (Chinese, Japanese, Korean)", parentId: asian.id },
      { name: "Southeast Asian (Thai, Vietnamese, Malaysian, Filipino)", parentId: asian.id },
      { name: "South Asian (Indian, Pakistani)", parentId: asian.id },
    ],
  });

  // European children
  await prisma.cuisine.createMany({
    data: [
      { name: "Southern European (Italian, Spanish, Greek, Portuguese)", parentId: european.id },
      { name: "Western European (French, German, British)", parentId: european.id },
      { name: "Eastern European (Polish, Russian, Hungarian)", parentId: european.id },
    ],
  });

  // Middle Eastern children
  await prisma.cuisine.createMany({
    data: [
      { name: "Lebanese", parentId: middleEastern.id },
      { name: "Turkish", parentId: middleEastern.id },
      { name: "Persian", parentId: middleEastern.id },
    ],
  });

  // Oceanian children
  await prisma.cuisine.createMany({
    data: [
      { name: "Australian", parentId: oceanian.id },
      { name: "New Zealander", parentId: oceanian.id },
    ],
  });
  
  console.log("Created hierarchical cuisines");

  // Create hierarchical categories
  console.log("Creating hierarchical categories...");
  
  // By Meal Type
  const byMealType = await prisma.category.create({ data: { name: "By Meal Type" } });
  await prisma.category.createMany({
    data: [
      { name: "Breakfast & Brunch", parentId: byMealType.id },
      { name: "Main Course", parentId: byMealType.id },
      { name: "Sandwiches, Wraps, & Burgers", parentId: byMealType.id },
      { name: "Pizza", parentId: byMealType.id },
      { name: "Appetizers & Snacks", parentId: byMealType.id },
      { name: "Soups & Stews", parentId: byMealType.id },
      { name: "Salads", parentId: byMealType.id },
      { name: "Side Dishes", parentId: byMealType.id },
      { name: "Beverages", parentId: byMealType.id },
    ],
  });
  
  // Desserts with children
  const desserts = await prisma.category.create({ data: { name: "Desserts", parentId: byMealType.id } });
  await prisma.category.createMany({
    data: [
      { name: "Cakes & Cupcakes", parentId: desserts.id },
      { name: "Pies & Tarts", parentId: desserts.id },
      { name: "Cookies & Bars", parentId: desserts.id },
      { name: "Frozen Desserts", parentId: desserts.id },
      { name: "Candy & Confections", parentId: desserts.id },
    ],
  });

  // By Main Ingredient
  const byIngredient = await prisma.category.create({ data: { name: "By Main Ingredient" } });
  await prisma.category.createMany({
    data: [
      { name: "Meat (Beef, Pork, Lamb)", parentId: byIngredient.id },
      { name: "Poultry (Chicken, Turkey)", parentId: byIngredient.id },
      { name: "Seafood (Fish, Shellfish)", parentId: byIngredient.id },
      { name: "Pasta & Noodles", parentId: byIngredient.id },
      { name: "Vegetables", parentId: byIngredient.id },
    ],
  });

  // Breads & Baking
  const breads = await prisma.category.create({ data: { name: "Breads & Baking" } });
  await prisma.category.createMany({
    data: [
      { name: "Artisan Breads", parentId: breads.id },
      { name: "Quick Breads", parentId: breads.id },
      { name: "Flatbreads", parentId: breads.id },
      { name: "Doughs & Pastries", parentId: breads.id },
    ],
  });

  // Pantry, Sauces, & Condiments
  const pantry = await prisma.category.create({ data: { name: "Pantry, Sauces, & Condiments" } });
  await prisma.category.createMany({
    data: [
      { name: "Sauces & Gravies (BBQ Sauce, Dipping Sauces)", parentId: pantry.id },
      { name: "Spice Blends & Rubs", parentId: pantry.id },
      { name: "Marinades & Dressings", parentId: pantry.id },
      { name: "Dips & Spreads", parentId: pantry.id },
      { name: "Preserves & Pickles", parentId: pantry.id },
    ],
  });

  // By Cooking Method
  const byMethod = await prisma.category.create({ data: { name: "By Cooking Method" } });
  await prisma.category.createMany({
    data: [
      { name: "Baking", parentId: byMethod.id },
      { name: "Grilling & BBQ", parentId: byMethod.id },
      { name: "Roasting", parentId: byMethod.id },
      { name: "Frying (Stir-Frying, Deep-Frying)", parentId: byMethod.id },
      { name: "Slow Cooking", parentId: byMethod.id },
      { name: "Air Frying", parentId: byMethod.id },
      { name: "No-Cook", parentId: byMethod.id },
    ],
  });

  // By Diet & Health
  const byDiet = await prisma.category.create({ data: { name: "By Diet & Health" } });
  await prisma.category.createMany({
    data: [
      { name: "Vegetarian", parentId: byDiet.id },
      { name: "Vegan", parentId: byDiet.id },
      { name: "Gluten-Free", parentId: byDiet.id },
      { name: "Keto / Low-Carb", parentId: byDiet.id },
    ],
  });

  // By Occasion
  const byOccasion = await prisma.category.create({ data: { name: "By Occasion" } });
  await prisma.category.createMany({
    data: [
      { name: "Weeknight Dinners", parentId: byOccasion.id },
      { name: "Holidays", parentId: byOccasion.id },
      { name: "Parties & Potlucks", parentId: byOccasion.id },
      { name: "Edible Gifts", parentId: byOccasion.id },
    ],
  });

  console.log("Created hierarchical categories");

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
  
  const userDataArray = [
    {
      username: "HomeBaker",
      email: "homebaker@example.com",
      bio: "Passionate home baker sharing family recipes and baking tips. I believe every meal should end with something sweet!",
    },
    {
      username: "ChefDad",
      email: "chefdad@example.com",
      bio: "Dad of three who loves cooking hearty meals for the family. Specializing in comfort food and BBQ classics.",
    },
    {
      username: "TheRealSpiceGirl",
      email: "therealspicegirl@example.com",
      bio: "Adventurous cook exploring bold flavors and spices from around the world. Life's too short for bland food!",
    },
  ];
  
  const users: User[] = [];
  for (const userData of userDataArray) {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: await bcrypt.hash("password123", 10),
        bio: userData.bio,
      },
    });
    users.push(user);
    console.log(`Created user: ${userData.username} (ID: ${user.id})`);
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
      
      // Remove single cuisine handling - will use many-to-many below
      
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
      
      // Handle cuisine many-to-many relationship
      if (data.cuisine) {
        const cuisine = await prisma.cuisine.findUnique({
          where: { name: data.cuisine },
        });
        if (cuisine) {
          await prisma.recipesCuisines.create({
            data: { recipeId: recipe.id, cuisineId: cuisine.id },
          });
        }
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
      
      // Create 2 reviews from other users with relevant comments
      const otherUsers = users.filter(u => u.id !== author.id);
      const reviewComments = [
        "This was absolutely delicious! The flavors were perfectly balanced and my family loved it.",
        "Great recipe! I made this for dinner last night and everyone asked for seconds.",
        "Easy to follow instructions and the result was amazing. Will definitely make again!",
        "Fantastic! The cooking times were spot on and the dish turned out restaurant-quality.",
        "This has become one of my go-to recipes. Always turns out great!",
        "Loved this! The ingredients were easy to find and the preparation was straightforward.",
        "My new favorite recipe! The texture and taste were exactly what I was hoping for.",
        "Outstanding results! Even my picky eaters enjoyed this one.",
      ];
      
      for (let i = 0; i < 2 && i < otherUsers.length; i++) {
        const reviewer = otherUsers[i];
        const comment = faker.helpers.arrayElement(reviewComments);
        await prisma.review.create({
          data: {
            recipeId: recipe.id,
            userId: reviewer.id,
            rating: faker.number.int({ min: 4, max: 5 }),
            comment: comment,
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
