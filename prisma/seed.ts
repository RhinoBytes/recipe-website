import { PrismaClient, Difficulty, RecipeStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { readRecipeFolders } from "../lib/recipeStorage.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

type DifficultyType = keyof typeof Difficulty;
type RecipeStatusType = keyof typeof RecipeStatus;

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

  // --- CREATE USERS ---
  console.log("Creating seed users...");
  const seedUsernames = ["HomeBaker", "ChefDad", "TheRealSpiceGirl"];
  const seedAvatarUrls = [
    "/users/HomeBaker.png",
    "/users/chefdad.png",
    "/users/spicegirl.png",
  ];
  const users = [];

  for (const [index, username] of seedUsernames.entries()) {
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username.toLowerCase()}@example.com`,
        passwordHash: await bcrypt.hash("password123", 10),
        avatarUrl: seedAvatarUrls[index],
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
    "Dessert",
    "Snack",
    "Appetizer",
    "Side Dish",
  ];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({ data: { name } });
    categories.push(category);
    console.log(`Created category: ${name} (ID: ${category.id})`);
  }

  // --- CREATE TAGS ---
  console.log("Creating tags...");
  const tagNames = [
    "Easy",
    "Quick",
    "Healthy",
    "Vegan",
    "Gluten-Free",
    "Vegetarian",
    "Low-Carb",
    "Kid-Friendly",
  ];
  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.tag.create({ data: { name } });
    tags.push(tag);
    console.log(`Created tag: ${name} (ID: ${tag.id})`);
  }

  // --- CREATE ALLERGENS ---
  console.log("Creating allergens...");
  const allergenNames = [
    "Peanuts",
    "Tree Nuts",
    "Dairy",
    "Gluten",
    "Eggs",
    "Soy",
    "Fish",
    "Shellfish",
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
  for (const { slug, data } of recipeFolders) {
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
          imageUrl: data.imageUrl,
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

      // Ingredients
      if (data.ingredients?.length) {
        await prisma.recipeIngredient.createMany({
          data: data.ingredients.map((ing) => ({
            recipeId: recipe.id,
            amount: ing.amount,
            unit: ing.unit || null,
            name: ing.name,
            notes: ing.notes,
            groupName: ing.groupName,
            isOptional: ing.isOptional || false,
            displayOrder: ing.displayOrder || 0,
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
