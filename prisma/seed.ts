import {
  PrismaClient,
  Difficulty,
  RecipeStatus,
  MeasurementUnit,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { readRecipeFolders } from "../lib/recipeStorage.js"; // notice the .js extension
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

type DifficultyType = keyof typeof Difficulty;
type RecipeStatusType = keyof typeof RecipeStatus;
type MeasurementUnitType = keyof typeof MeasurementUnit;

async function main() {
  console.log("Seeding database...");

  // Delete all existing recipes and related data (cascading deletes will handle relations)
  console.log("Deleting existing recipes...");
  await prisma.recipe.deleteMany({});
  console.log("Existing recipes deleted.");

  // Create or get users (seed users for testing)
  console.log("Creating seed users...");
  const seedUsernames = ["HomeBaker", "ChefDad", "TheRealSpiceGirl"];
  const users = [];

  for (const username of seedUsernames) {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          email: `${username.toLowerCase()}@example.com`,
          passwordHash: "password123",
          avatarUrl: `https://images.unsplash.com/photo-${faker.string.numeric(
            13
          )}?auto=format&fit=crop&w=400&h=400`,
          bio: faker.lorem.sentence(),
        },
      });
    }

    users.push(user);
  }

  // Create Categories if they don't exist
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
    let category = await prisma.category.findUnique({ where: { name } });
    if (!category) {
      category = await prisma.category.create({ data: { name } });
    }
    categories.push(category);
  }

  // Create Tags if they don't exist
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
    let tag = await prisma.tag.findUnique({ where: { name } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name } });
    }
    tags.push(tag);
  }

  // Create Allergens if they don't exist
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
    let allergen = await prisma.allergen.findUnique({ where: { name } });
    if (!allergen) {
      allergen = await prisma.allergen.create({ data: { name } });
    }
    allergens.push(allergen);
  }

  // Read recipe folders from /prisma/data/recipes/
  console.log("Reading recipe folders...");
  const recipeFolders = readRecipeFolders();
  console.log(`Found ${recipeFolders.length} recipe(s) to import.`);

  // Create recipes from JSON files
  for (const { slug, data } of recipeFolders) {
    console.log(`Creating recipe: ${data.title}`);

    try {
      // Select random author
      const author = faker.helpers.arrayElement(users);

      // Handle cuisine
      let cuisineId = null;
      if (data.cuisine) {
        let cuisine = await prisma.cuisine.findUnique({
          where: { name: data.cuisine },
        });

        if (!cuisine) {
          cuisine = await prisma.cuisine.create({
            data: { name: data.cuisine },
          });
        }

        cuisineId = cuisine.id;
      }

      // Create the recipe
      const recipe = await prisma.recipe.create({
        data: {
          authorId: author.id,
          title: data.title,
          slug: data.slug || slug,
          description: data.description,
          servings: data.servings,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          difficulty: data.difficulty as DifficultyType | null,
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

      // Create ingredients
      if (data.ingredients && Array.isArray(data.ingredients)) {
        await prisma.recipeIngredient.createMany({
          data: data.ingredients.map((ing) => ({
            recipeId: recipe.id,
            amount: ing.amount,
            unit: ing.unit as MeasurementUnitType | null,
            name: ing.name,
            notes: ing.notes,
            groupName: ing.groupName,
            isOptional: ing.isOptional || false,
            displayOrder: ing.displayOrder || 0,
          })),
        });
      }

      // Create steps
      if (data.steps && Array.isArray(data.steps)) {
        await prisma.recipeStep.createMany({
          data: data.steps.map((step) => ({
            recipeId: recipe.id,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            isOptional: step.isOptional || false,
          })),
        });
      }

      // Handle tags
      if (data.tags && Array.isArray(data.tags)) {
        for (const tagName of data.tags) {
          let tag = await prisma.tag.findUnique({ where: { name: tagName } });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } });
          }
          await prisma.recipesTags.create({
            data: { recipeId: recipe.id, tagId: tag.id },
          });
        }
      }

      // Handle categories
      if (data.categories && Array.isArray(data.categories)) {
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

      // Handle allergens
      if (data.allergens && Array.isArray(data.allergens)) {
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

      // Add some fake reviews (0-3 per recipe)
      const reviewsCount = faker.number.int({ min: 0, max: 3 });
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

      console.log(`✓ Created recipe: ${data.title}`);
    } catch (error) {
      console.error(`✗ Error creating recipe ${data.title}:`, error);
    }
  }

  // If no recipes were imported, create some fake ones for testing
  if (recipeFolders.length === 0) {
    console.log(
      "No recipe JSON files found. Creating sample recipes with fake data..."
    );

    for (let i = 0; i < 10; i++) {
      const author = faker.helpers.arrayElement(users);
      const title = faker.lorem.words(3);
      const recipeSlug = faker.helpers.slugify(title).toLowerCase();

      const recipe = await prisma.recipe.create({
        data: {
          authorId: author.id,
          title,
          slug: recipeSlug,
          description: faker.lorem.sentences(2),
          servings: faker.number.int({ min: 2, max: 8 }),
          prepTimeMinutes: faker.number.int({ min: 10, max: 60 }),
          cookTimeMinutes: faker.number.int({ min: 15, max: 120 }),
          difficulty: faker.helpers.arrayElement([
            Difficulty.EASY,
            Difficulty.MEDIUM,
            Difficulty.HARD,
          ]),
          imageUrl: `https://images.unsplash.com/photo-${faker.string.numeric(
            13
          )}?auto=format&fit=crop&w=800&h=600`,
          status: RecipeStatus.PUBLISHED,
          calories: faker.number.int({ min: 150, max: 800 }),
          proteinG: faker.number.int({ min: 5, max: 50 }),
          fatG: faker.number.int({ min: 5, max: 40 }),
          carbsG: faker.number.int({ min: 10, max: 100 }),
        },
      });

      // Add ingredients (3-6 per recipe)
      const ingredientsCount = faker.number.int({ min: 3, max: 6 });
      for (let j = 0; j < ingredientsCount; j++) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            name: faker.food.ingredient(),
            amount: faker.number
              .float({ min: 0.5, max: 5, fractionDigits: 1 })
              .toString(),
            unit: faker.helpers.arrayElement([
              MeasurementUnit.CUP,
              MeasurementUnit.TBSP,
              MeasurementUnit.TSP,
              MeasurementUnit.G,
              MeasurementUnit.ML,
              MeasurementUnit.PIECE,
            ]),
            displayOrder: j,
          },
        });
      }

      // Add steps (3-5 per recipe)
      const stepsCount = faker.number.int({ min: 3, max: 5 });
      for (let s = 0; s < stepsCount; s++) {
        await prisma.recipeStep.create({
          data: {
            recipeId: recipe.id,
            stepNumber: s + 1,
            instruction: faker.lorem.sentence(),
          },
        });
      }

      // Add 1-2 categories
      const selectedCategories = faker.helpers.arrayElements(
        categories,
        faker.number.int({ min: 1, max: 2 })
      );
      for (const category of selectedCategories) {
        await prisma.recipesCategories.create({
          data: { recipeId: recipe.id, categoryId: category.id },
        });
      }

      // Add 1-2 tags
      const selectedTags = faker.helpers.arrayElements(
        tags,
        faker.number.int({ min: 1, max: 2 })
      );
      for (const tag of selectedTags) {
        await prisma.recipesTags.create({
          data: { recipeId: recipe.id, tagId: tag.id },
        });
      }

      // Add 0-1 allergens
      if (faker.datatype.boolean()) {
        const allergen = faker.helpers.arrayElement(allergens);
        await prisma.recipesAllergens.create({
          data: { recipeId: recipe.id, allergenId: allergen.id },
        });
      }

      // Add 0-2 reviews
      const reviewsCount = faker.number.int({ min: 0, max: 2 });
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

      console.log(`✓ Created sample recipe: ${title}`);
    }
  }

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
