/*
  Warnings:

  - You are about to drop the column `instructions` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Recipe` table. All the data in the column will be lost.
  - The `difficulty` column on the `Recipe` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `unit` column on the `RecipeIngredient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('CUP', 'TBSP', 'TSP', 'FL_OZ', 'ML', 'L', 'PINT', 'QUART', 'GALLON', 'OZ', 'LB', 'G', 'KG', 'MG', 'PIECE', 'WHOLE', 'SLICE', 'CLOVE', 'PINCH', 'DASH', 'HANDFUL', 'TO_TASTE', 'AS_NEEDED');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- DropForeignKey
ALTER TABLE "public"."FavoriteRecipe" DROP CONSTRAINT "FavoriteRecipe_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecipesAllergens" DROP CONSTRAINT "RecipesAllergens_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecipesCategories" DROP CONSTRAINT "RecipesCategories_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecipesTags" DROP CONSTRAINT "RecipesTags_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Review" DROP CONSTRAINT "Review_recipeId_fkey";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "instructions",
DROP COLUMN "isPublished",
ADD COLUMN     "averageRating" DECIMAL(3,2),
ADD COLUMN     "cuisineId" TEXT,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceText" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "status" "RecipeStatus" NOT NULL DEFAULT 'DRAFT',
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty";

-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "isOptional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "amount" SET DATA TYPE TEXT,
DROP COLUMN "unit",
ADD COLUMN     "unit" "MeasurementUnit";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuisine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Cuisine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeStep_recipeId_stepNumber_key" ON "RecipeStep"("recipeId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Cuisine_name_key" ON "Cuisine"("name");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesCategories" ADD CONSTRAINT "RecipesCategories_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesTags" ADD CONSTRAINT "RecipesTags_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesAllergens" ADD CONSTRAINT "RecipesAllergens_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
