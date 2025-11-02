/**
 * Seed Media Cleanup Script
 * 
 * This script safely deletes all media assets that were created during database seeding.
 * It identifies seed media by the folder structure in Cloudinary and deletes both
 * the cloud assets and database records.
 * 
 * SAFETY: Only deletes assets in the "recipe-website/seed" folder
 * 
 * Usage:
 *   node --loader ts-node/esm scripts/reset-seed-media.ts
 *   
 * Or add to package.json:
 *   "scripts": {
 *     "seed:reset": "node --loader ts-node/esm scripts/reset-seed-media.ts && npm run seed"
 *   }
 */

import { PrismaClient } from "@prisma/client";
import { deleteCloudinaryAsset } from "../lib/cloudinary.js";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

/**
 * Configuration for seed media identification
 */
const SEED_FOLDER_PREFIX = "recipe-website/seed";

/**
 * Statistics tracker
 */
interface CleanupStats {
  mediaRecordsFound: number;
  mediaRecordsDeleted: number;
  cloudinaryAssetsDeleted: number;
  cloudinaryErrors: number;
  databaseErrors: number;
}

const stats: CleanupStats = {
  mediaRecordsFound: 0,
  mediaRecordsDeleted: 0,
  cloudinaryAssetsDeleted: 0,
  cloudinaryErrors: 0,
  databaseErrors: 0,
};

/**
 * Find all seed media records in the database
 */
async function findSeedMedia() {
  console.log(`\n🔍 Searching for seed media in folder: ${SEED_FOLDER_PREFIX}`);
  
  const seedMedia = await prisma.media.findMany({
    where: {
      OR: [
        {
          folder: {
            startsWith: SEED_FOLDER_PREFIX,
          },
        },
        {
          publicId: {
            startsWith: SEED_FOLDER_PREFIX,
          },
        },
      ],
    },
    select: {
      id: true,
      publicId: true,
      folder: true,
      resourceType: true,
      url: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      recipe: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  stats.mediaRecordsFound = seedMedia.length;
  console.log(`✅ Found ${seedMedia.length} seed media records`);
  
  return seedMedia;
}

/**
 * Delete a single media asset from Cloudinary
 */
async function deleteFromCloudinary(
  publicId: string,
  resourceType: string
): Promise<boolean> {
  try {
    const type = resourceType.toLowerCase() as "image" | "video";
    await deleteCloudinaryAsset(publicId, type);
    stats.cloudinaryAssetsDeleted++;
    return true;
  } catch (error) {
    stats.cloudinaryErrors++;
    console.error(`  ❌ Failed to delete from Cloudinary: ${publicId}`);
    console.error(`     Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Delete a media record from the database
 */
async function deleteFromDatabase(mediaId: string): Promise<boolean> {
  try {
    await prisma.media.delete({
      where: { id: mediaId },
    });
    stats.mediaRecordsDeleted++;
    return true;
  } catch (error) {
    stats.databaseErrors++;
    console.error(`  ❌ Failed to delete from database: ${mediaId}`);
    console.error(`     Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

/**
 * Clean up seed media
 */
async function cleanupSeedMedia() {
  console.log("\n🧹 Starting seed media cleanup...");
  console.log("=" .repeat(60));

  // Find all seed media
  const seedMedia = await findSeedMedia();

  if (seedMedia.length === 0) {
    console.log("\n✨ No seed media found. Nothing to clean up.");
    return;
  }

  // Confirm deletion
  console.log("\n⚠️  WARNING: This will delete the following:");
  console.log(`   - ${seedMedia.length} media records from database`);
  console.log(`   - ${seedMedia.length} assets from Cloudinary`);
  console.log(`   - Folder: ${SEED_FOLDER_PREFIX}/*`);
  
  // In a production script, you might want to add a confirmation prompt here
  // For now, we'll proceed automatically since this is a dev/seed cleanup script
  
  console.log("\n🗑️  Deleting media assets...");

  for (const media of seedMedia) {
    const displayName = media.recipe?.title || media.user.username || media.publicId;
    console.log(`\n📦 Processing: ${displayName}`);
    console.log(`   Public ID: ${media.publicId}`);
    console.log(`   Folder: ${media.folder || "N/A"}`);
    console.log(`   Type: ${media.resourceType}`);

    // Delete from Cloudinary first
    console.log("   ☁️  Deleting from Cloudinary...");
    const cloudinaryDeleted = await deleteFromCloudinary(
      media.publicId,
      media.resourceType
    );

    if (cloudinaryDeleted) {
      console.log("   ✅ Cloudinary asset deleted");
    }

    // Delete from database (even if Cloudinary deletion failed)
    // This prevents orphaned database records
    console.log("   🗄️  Deleting from database...");
    const dbDeleted = await deleteFromDatabase(media.id);

    if (dbDeleted) {
      console.log("   ✅ Database record deleted");
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Cleanup Summary:");
  console.log("=" .repeat(60));
  console.log(`Media records found:           ${stats.mediaRecordsFound}`);
  console.log(`Media records deleted:         ${stats.mediaRecordsDeleted}`);
  console.log(`Cloudinary assets deleted:     ${stats.cloudinaryAssetsDeleted}`);
  console.log(`Cloudinary deletion errors:    ${stats.cloudinaryErrors}`);
  console.log(`Database deletion errors:      ${stats.databaseErrors}`);
  console.log("=" .repeat(60));

  if (stats.cloudinaryErrors > 0 || stats.databaseErrors > 0) {
    console.log("\n⚠️  Some deletions failed. Check errors above.");
    console.log("   You may need to manually clean up failed items.");
  } else {
    console.log("\n✅ All seed media cleaned up successfully!");
  }
}

/**
 * Optional: Clean up seed users and recipes
 * This is more aggressive and should be used with caution
 */
async function cleanupSeedData(deleteUsers: boolean = false) {
  console.log("\n🗑️  Cleaning up seed data (recipes, users, etc.)...");
  
  // This would typically be handled by your regular seed reset
  // which deletes all data and re-seeds
  
  // If you want to selectively delete seed data while preserving
  // user-created content, you'd need to tag seed data during creation
  // and filter by those tags here
  
  console.log("   Skipping user/recipe deletion - use 'npx prisma migrate reset' for full reset");
}

/**
 * Main execution
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🌱 Seed Media Cleanup Script");
  console.log("=".repeat(60));
  
  try {
    // Clean up seed media
    await cleanupSeedMedia();
    
    console.log("\n✨ Cleanup complete!");
    console.log("\nTo reseed the database, run: npm run seed");
    
  } catch (error) {
    console.error("\n❌ Cleanup failed with error:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
