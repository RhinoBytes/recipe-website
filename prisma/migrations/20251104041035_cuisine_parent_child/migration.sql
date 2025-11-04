/*
  Warnings:

  - You are about to drop the column `cuisineId` on the `Recipe` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Recipe" DROP CONSTRAINT "Recipe_cuisineId_fkey";

-- AlterTable
ALTER TABLE "Cuisine" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "cuisineId";

-- CreateTable
CREATE TABLE "RecipesCuisines" (
    "recipeId" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "RecipesCuisines_pkey" PRIMARY KEY ("recipeId","cuisineId")
);

-- AddForeignKey
ALTER TABLE "Cuisine" ADD CONSTRAINT "Cuisine_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Cuisine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesCuisines" ADD CONSTRAINT "RecipesCuisines_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipesCuisines" ADD CONSTRAINT "RecipesCuisines_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "Cuisine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
