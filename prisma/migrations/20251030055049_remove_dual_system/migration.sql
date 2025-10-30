/*
  Warnings:

  - You are about to drop the `IngredientMeasurement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."IngredientMeasurement" DROP CONSTRAINT "IngredientMeasurement_recipeIngredientId_fkey";

-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "amount" TEXT,
ADD COLUMN     "unit" TEXT;

-- DropTable
DROP TABLE "public"."IngredientMeasurement";

-- DropEnum
DROP TYPE "public"."MeasurementSystem";
