import fs from "fs";
import { supabaseAdmin } from "./supabase/server.js";
import { PrismaClient, Media } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Upload an image file to Supabase Storage and create a Media record
 * @param filePath Path to the local image file
 * @param folder Supabase storage folder path
 * @param userId User ID for the media record
 * @param isProfileAvatar Whether this is a profile avatar
 * @returns Media object or null if upload fails
 */
export async function uploadImageToSupabase(
  filePath: string,
  folder: string,
  userId: string,
  isProfileAvatar: boolean = false
): Promise<Media | null> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File not found: ${filePath}`);
      return null;
    }

    console.log(`  ☁️  Uploading to Supabase: ${filePath}`);

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split("/").pop() || "image.jpg";
    const fileExt = fileName.split(".").pop() || "jpg";
    
    // Generate unique storage path
    const timestamp = Date.now();
    const storagePath = `${folder}/${timestamp}-${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("recipe-builder")
      .upload(storagePath, fileBuffer, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`  ❌ Supabase upload failed: ${uploadError.message}`);
      return null;
    }

    console.log(`  ✅ Uploaded to Supabase: ${uploadData.path}`);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("recipe-builder")
      .getPublicUrl(uploadData.path);

    // Get file stats for size
    const stats = fs.statSync(filePath);

    // Create Media record in database
    const media = await prisma.media.create({
      data: {
        publicId: uploadData.path,
        url: urlData.publicUrl,
        secureUrl: urlData.publicUrl,
        mimeType: `image/${fileExt}`,
        size: stats.size,
        width: null,
        height: null,
        originalFilename: fileName,
        folder: folder,
        resourceType: "IMAGE",
        userId: userId,
        isProfileAvatar: isProfileAvatar,
        isPrimary: false, // Will be set later for recipes
      },
    });

    console.log(`  ✅ Created Media record: ${media.id}`);
    return media;
  } catch (error) {
    console.error(`  ❌ Failed to upload image:`, error);
    return null;
  }
}
