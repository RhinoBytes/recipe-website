import fs from "fs";
import { supabaseAdmin } from "./supabase/server.js";
import { Media } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

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
      log.error({ filePath }, "File not found");
      return null;
    }

    log.info({ filePath }, "Uploading to Supabase");

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
      log.error({ error: uploadError.message }, "Supabase upload failed");
      return null;
    }

    log.info({ path: uploadData.path }, "Uploaded to Supabase");

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

    log.info({ mediaId: media.id }, "Created Media record");
    return media;
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Failed to upload image");
    return null;
  }
}
