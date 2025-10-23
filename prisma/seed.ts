import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.recipesAllergens.deleteMany();
  await prisma.recipesTags.deleteMany();
  await prisma.recipesCategories.deleteMany();
  await prisma.favoriteRecipe.deleteMany();
  await prisma.review.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.allergen.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "chef_alice",
        email: "alice@example.com",
        passwordHash,
        bio: "Professional chef specializing in Italian cuisine",
        role: "USER",
      },
    }),
    prisma.user.create({
      data: {
        username: "baker_bob",
        email: "bob@example.com",
        passwordHash,
        bio: "Home baker with a passion for desserts",
        role: "USER",
      },
    }),
    prisma.user.create({
      data: {
        username: "admin",
        email: "admin@example.com",
        passwordHash,
        bio: "Site administrator",
        role: "ADMIN",
      },
    }),
  ]);

  console.log("Created users");

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Breakfast" } }),
    prisma.category.create({ data: { name: "Lunch" } }),
    prisma.category.create({ data: { name: "Dinner" } }),
    prisma.category.create({ data: { name: "Dessert" } }),
    prisma.category.create({ data: { name: "Vegetarian" } }),
    prisma.category.create({ data: { name: "Vegan" } }),
  ]);

  console.log("Created categories");

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "Quick" } }),
    prisma.tag.create({ data: { name: "Easy" } }),
    prisma.tag.create({ data: { name: "Healthy" } }),
    prisma.tag.create({ data: { name: "Comfort Food" } }),
    prisma.tag.create({ data: { name: "Low Carb" } }),
    prisma.tag.create({ data: { name: "Family Friendly" } }),
  ]);

  console.log("Created tags");

  // Create Allergens
  const allergens = await Promise.all([
    prisma.allergen.create({ data: { name: "Dairy" } }),
    prisma.allergen.create({ data: { name: "Eggs" } }),
    prisma.allergen.create({ data: { name: "Gluten" } }),
    prisma.allergen.create({ data: { name: "Nuts" } }),
    prisma.allergen.create({ data: { name: "Soy" } }),
  ]);

  console.log("Created allergens");

  // Create Recipes
  const recipe1 = await prisma.recipe.create({
    data: {
      title: "Classic Spaghetti Carbonara",
      slug: "classic-spaghetti-carbonara",
      description:
        "Traditional Italian pasta dish with eggs, cheese, and pancetta",
      instructions:
        "1. Cook pasta in salted boiling water\n2. Fry pancetta until crispy\n3. Mix eggs with cheese\n4. Combine everything while pasta is hot\n5. Serve immediately",
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      isPublished: true,
      calories: 550,
      proteinG: 25,
      fatG: 22,
      carbsG: 65,
      authorId: users[0].id,
    },
  });

  const recipe2 = await prisma.recipe.create({
    data: {
      title: "Chocolate Chip Cookies",
      slug: "chocolate-chip-cookies",
      description: "Chewy and delicious homemade chocolate chip cookies",
      instructions:
        "1. Cream butter and sugars\n2. Add eggs and vanilla\n3. Mix in dry ingredients\n4. Fold in chocolate chips\n5. Bake at 350°F for 12 minutes",
      servings: 24,
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      isPublished: true,
      calories: 150,
      proteinG: 2,
      fatG: 7,
      carbsG: 21,
      authorId: users[1].id,
    },
  });

  const recipe3 = await prisma.recipe.create({
    data: {
      title: "Avocado Toast",
      slug: "avocado-toast",
      description: "Simple and healthy breakfast option",
      instructions:
        "1. Toast bread\n2. Mash avocado with lemon juice\n3. Spread on toast\n4. Season with salt and pepper\n5. Optional: add toppings",
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      isPublished: true,
      calories: 250,
      proteinG: 8,
      fatG: 15,
      carbsG: 25,
      authorId: users[0].id,
    },
  });

  console.log("Created recipes");

  // Add Ingredients
  await Promise.all([
    // Carbonara ingredients
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe1.id,
        amount: 400,
        unit: "g",
        name: "Spaghetti",
        displayOrder: 1,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe1.id,
        amount: 200,
        unit: "g",
        name: "Pancetta",
        displayOrder: 2,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe1.id,
        amount: 4,
        unit: "whole",
        name: "Eggs",
        displayOrder: 3,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe1.id,
        amount: 100,
        unit: "g",
        name: "Parmesan cheese",
        displayOrder: 4,
      },
    }),
    // Cookie ingredients
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe2.id,
        amount: 2.25,
        unit: "cups",
        name: "All-purpose flour",
        displayOrder: 1,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe2.id,
        amount: 1,
        unit: "cup",
        name: "Butter",
        displayOrder: 2,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe2.id,
        amount: 2,
        unit: "cups",
        name: "Chocolate chips",
        displayOrder: 3,
      },
    }),
    // Avocado toast ingredients
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe3.id,
        amount: 2,
        unit: "slices",
        name: "Whole grain bread",
        displayOrder: 1,
      },
    }),
    prisma.recipeIngredient.create({
      data: {
        recipeId: recipe3.id,
        amount: 1,
        unit: "whole",
        name: "Ripe avocado",
        displayOrder: 2,
      },
    }),
  ]);

  console.log("Created ingredients");

  // Link Recipes to Categories
  await Promise.all([
    prisma.recipesCategories.create({
      data: { recipeId: recipe1.id, categoryId: categories[2].id },
    }), // Dinner
    prisma.recipesCategories.create({
      data: { recipeId: recipe2.id, categoryId: categories[3].id },
    }), // Dessert
    prisma.recipesCategories.create({
      data: { recipeId: recipe3.id, categoryId: categories[0].id },
    }), // Breakfast
    prisma.recipesCategories.create({
      data: { recipeId: recipe3.id, categoryId: categories[4].id },
    }), // Vegetarian
  ]);

  console.log("Linked recipes to categories");

  // Link Recipes to Tags
  await Promise.all([
    prisma.recipesTags.create({
      data: { recipeId: recipe1.id, tagId: tags[3].id },
    }), // Comfort Food
    prisma.recipesTags.create({
      data: { recipeId: recipe2.id, tagId: tags[1].id },
    }), // Easy
    prisma.recipesTags.create({
      data: { recipeId: recipe2.id, tagId: tags[5].id },
    }), // Family Friendly
    prisma.recipesTags.create({
      data: { recipeId: recipe3.id, tagId: tags[0].id },
    }), // Quick
    prisma.recipesTags.create({
      data: { recipeId: recipe3.id, tagId: tags[2].id },
    }), // Healthy
  ]);

  console.log("Linked recipes to tags");

  // Link Recipes to Allergens
  await Promise.all([
    prisma.recipesAllergens.create({
      data: { recipeId: recipe1.id, allergenId: allergens[0].id },
    }), // Dairy
    prisma.recipesAllergens.create({
      data: { recipeId: recipe1.id, allergenId: allergens[1].id },
    }), // Eggs
    prisma.recipesAllergens.create({
      data: { recipeId: recipe1.id, allergenId: allergens[2].id },
    }), // Gluten
    prisma.recipesAllergens.create({
      data: { recipeId: recipe2.id, allergenId: allergens[0].id },
    }), // Dairy
    prisma.recipesAllergens.create({
      data: { recipeId: recipe2.id, allergenId: allergens[1].id },
    }), // Eggs
    prisma.recipesAllergens.create({
      data: { recipeId: recipe2.id, allergenId: allergens[2].id },
    }), // Gluten
    prisma.recipesAllergens.create({
      data: { recipeId: recipe3.id, allergenId: allergens[2].id },
    }), // Gluten
  ]);

  console.log("Linked recipes to allergens");

  // Create Reviews
  await Promise.all([
    prisma.review.create({
      data: {
        recipeId: recipe1.id,
        userId: users[1].id,
        rating: 5,
        comment: "Absolutely delicious! Best carbonara I've made at home.",
      },
    }),
    prisma.review.create({
      data: {
        recipeId: recipe1.id,
        userId: users[2].id,
        rating: 4,
        comment: "Great recipe, very authentic.",
      },
    }),
    prisma.review.create({
      data: {
        recipeId: recipe2.id,
        userId: users[0].id,
        rating: 5,
        comment: "My kids loved these cookies!",
      },
    }),
    prisma.review.create({
      data: {
        recipeId: recipe3.id,
        userId: users[1].id,
        rating: 4,
        comment: "Quick and healthy breakfast option.",
      },
    }),
  ]);

  console.log("Created reviews");

  // Create Favorites
  await Promise.all([
    prisma.favoriteRecipe.create({
      data: { userId: users[0].id, recipeId: recipe2.id },
    }),
    prisma.favoriteRecipe.create({
      data: { userId: users[1].id, recipeId: recipe1.id },
    }),
    prisma.favoriteRecipe.create({
      data: { userId: users[1].id, recipeId: recipe3.id },
    }),
    prisma.favoriteRecipe.create({
      data: { userId: users[2].id, recipeId: recipe1.id },
    }),
  ]);

  console.log("Created favorites");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
