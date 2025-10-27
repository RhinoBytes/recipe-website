const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();
async function main() {
  console.log("Seeding database...");

  // 1. Create Users
  const users = await Promise.all(
    ["alice", "bob", "carol"].map(async (username) => {
      return prisma.user.create({
        data: {
          username,
          email: `${username}@example.com`,
          passwordHash: faker.internet.password(),
          avatarUrl: `https://images.unsplash.com/photo-${faker.string.uuid()}?auto=format&fit=crop&w=640&h=480`,
          bio: faker.lorem.sentence(),
        },
      });
    })
  );

  // 2. Create Categories
  const categories = await Promise.all(
    ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"].map((name) =>
      prisma.category.create({ data: { name } })
    )
  );

  // 3. Create Tags
  const tags = await Promise.all(
    ["Easy", "Quick", "Healthy", "Vegan", "Gluten-Free"].map((name) =>
      prisma.tag.create({ data: { name } })
    )
  );

  // 4. Create Allergens
  const allergens = await Promise.all(
    ["Peanuts", "Dairy", "Gluten", "Eggs", "Soy"].map((name) =>
      prisma.allergen.create({ data: { name } })
    )
  );

  // 5. Create Recipes
  const recipes = [];
  for (let i = 0; i < 20; i++) {
    const author = users[i % users.length];
    const recipe = await prisma.recipe.create({
      data: {
        authorId: author.id,
        title: faker.lorem.words(3),
        slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
        description: faker.lorem.sentences(2),
        instructions: faker.lorem.paragraphs(2),
        servings: faker.number.int({ min: 1, max: 6 }),
        prepTimeMinutes: faker.number.int({ min: 5, max: 60 }),
        cookTimeMinutes: faker.number.int({ min: 5, max: 120 }),
        difficulty: faker.helpers.arrayElement(["Easy", "Medium", "Hard"]),
        imageUrl: `https://images.unsplash.com/photo-${faker.string.uuid()}?auto=format&fit=crop&w=640&h=480`,
        isPublished: true,
        calories: faker.number.int({ min: 100, max: 1000 }),
        proteinG: faker.number.int({ min: 5, max: 50 }),
        fatG: faker.number.int({ min: 5, max: 50 }),
        carbsG: faker.number.int({ min: 5, max: 100 }),
      },
    });

    recipes.push(recipe);

    // 5a. Add Ingredients (3-6 per recipe)
    const ingredientsCount = faker.number.int({ min: 3, max: 6 });
    for (let j = 0; j < ingredientsCount; j++) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          name: faker.food.ingredient(),
          amount: faker.number.float({ min: 0.1, max: 5, fractionDigits: 1 }),
          unit: faker.helpers.arrayElement(["g", "ml", "cups", "tbsp", "tsp"]),
          displayOrder: j,
        },
      });
    }

    // 5b. Add 1-2 categories
    const selectedCategories = faker.helpers.arrayElements(
      categories,
      faker.number.int({ min: 1, max: 2 })
    );
    for (const category of selectedCategories) {
      await prisma.recipesCategories.create({
        data: { recipeId: recipe.id, categoryId: category.id },
      });
    }

    // 5c. Add 1-2 tags
    const selectedTags = faker.helpers.arrayElements(
      tags,
      faker.number.int({ min: 1, max: 2 })
    );
    for (const tag of selectedTags) {
      await prisma.recipesTags.create({
        data: { recipeId: recipe.id, tagId: tag.id },
      });
    }

    // 5d. Add 0-1 allergens
    const selectedAllergens = faker.helpers.arrayElements(
      allergens,
      faker.number.int({ min: 0, max: 1 })
    );
    for (const allergen of selectedAllergens) {
      await prisma.recipesAllergens.create({
        data: { recipeId: recipe.id, allergenId: allergen.id },
      });
    }

    // 5e. Add 0-2 reviews
    const reviewsCount = faker.number.int({ min: 0, max: 2 });
    for (let r = 0; r < reviewsCount; r++) {
      const reviewer = faker.helpers.arrayElement(users);
      await prisma.review.create({
        data: {
          recipeId: recipe.id,
          userId: reviewer.id,
          rating: faker.number.int({ min: 1, max: 5 }),
          comment: faker.lorem.sentence(),
        },
      });
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
