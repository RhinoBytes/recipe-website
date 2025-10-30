/*
  Warnings:

  - You are about to drop the column `amount` on the `RecipeIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `RecipeIngredient` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MeasurementSystem" AS ENUM ('METRIC', 'IMPERIAL', 'OTHER');

-- AlterTable
ALTER TABLE "RecipeIngredient" DROP COLUMN "amount",
DROP COLUMN "unit",
ADD COLUMN     "preparation" TEXT,
ADD COLUMN     "size" TEXT;

-- CreateTable
CREATE TABLE "IngredientMeasurement" (
    "id" TEXT NOT NULL,
    "recipeIngredientId" TEXT NOT NULL,
    "system" "MeasurementSystem" NOT NULL,
    "amount" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "IngredientMeasurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IngredientMeasurement" ADD CONSTRAINT "IngredientMeasurement_recipeIngredientId_fkey" FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
