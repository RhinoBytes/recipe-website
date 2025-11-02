-- AlterTable: Remove imageUrl from Recipe
ALTER TABLE "Recipe" DROP COLUMN IF EXISTS "imageUrl";

-- AlterTable: Remove avatarUrl from User  
ALTER TABLE "User" DROP COLUMN IF EXISTS "avatarUrl";

-- AlterTable: Add new fields to Media
ALTER TABLE "Media" ADD COLUMN "isProfileAvatar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Media" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Media_userId_isProfileAvatar_idx" ON "Media"("userId", "isProfileAvatar");

-- CreateIndex
CREATE INDEX "Media_recipeId_isPrimary_idx" ON "Media"("recipeId", "isPrimary");
