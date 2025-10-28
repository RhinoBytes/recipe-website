-- AlterTable
ALTER TABLE "RecipeIngredient" ALTER COLUMN "unit" TYPE TEXT;

-- DropEnum
DROP TYPE "MeasurementUnit";
