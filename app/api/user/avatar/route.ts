import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { log } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Helper function to mark previous profile avatars as not primary
 */
async function deactivatePreviousAvatars(userId: string) {
  await prisma.media.updateMany({
    where: {
      userId,
      isProfileAvatar: true,
    },
    data: {
      isProfileAvatar: false,
    },
  });
}

/**
 * Helper function to determine MIME type from file path
 */
function getMimeTypeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  };
  return mimeMap[ext || ''] || 'image/jpeg';
}

/**
 * POST /api/user/avatar
 * Upload or select a user avatar
 * 
 * Supports two modes:
 * 1. Upload: Upload a custom image file
 * 2. Select: Select a pre-existing profile photo URL
 */
export async function POST(request: Request) {
  try {
    // Authentication required
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type');
    
    // Handle multipart/form-data (file upload)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get("image") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No image file provided" },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 5MB" },
          { status: 400 }
        );
      }

      // Generate unique filename
      let fileExtension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
      // If no extension, infer from MIME type
      if (!fileExtension || fileExtension === file.name) {
        const mimeToExt: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        fileExtension = mimeToExt[file.type];
        if (!fileExtension) {
          return NextResponse.json(
            { error: "Could not determine file extension from MIME type" },
            { status: 400 }
          );
        }
      }
      const uniqueFilename = `avatar-${currentUser.userId}-${randomUUID()}.${fileExtension}`;
      
      // Upload to Supabase Storage
      const filePath = `avatars/${uniqueFilename}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recipe-builder")
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        log.error({ error: uploadError }, "Supabase upload error");
        return NextResponse.json(
          { error: `Failed to upload to storage: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("recipe-builder")
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // Mark previous profile avatar as not primary
      await deactivatePreviousAvatars(currentUser.userId);

      // Create Media record for the uploaded avatar
      const media = await prisma.media.create({
        data: {
          publicId: uniqueFilename,
          url: publicUrl,
          secureUrl: publicUrl,
          mimeType: file.type,
          size: file.size,
          originalFilename: file.name,
          folder: "avatars",
          userId: currentUser.userId,
          isProfileAvatar: true,
          resourceType: "IMAGE",
        },
      });

      return NextResponse.json({
        success: true,
        avatarUrl: publicUrl,
        mediaId: media.id,
      });
    }

    // Handle JSON (selecting from default avatars)
    const body = await request.json();
    const { avatarUrl } = body;

    if (!avatarUrl) {
      log.warn({ userId: currentUser.userId }, "Avatar update attempt without avatarUrl");
      return NextResponse.json(
        { error: "avatarUrl is required" },
        { status: 400 }
      );
    }

    // Mark previous profile avatar as not primary
    await deactivatePreviousAvatars(currentUser.userId);

    // Determine correct MIME type from file extension
    const mimeType = getMimeTypeFromPath(avatarUrl);

    // Create Media record for the selected avatar
    const media = await prisma.media.create({
      data: {
        publicId: `profile-photo-${Date.now()}`,
        url: avatarUrl,
        secureUrl: avatarUrl,
        mimeType,
        size: 0, // Default avatars don't have a tracked size
        userId: currentUser.userId,
        isProfileAvatar: true,
        resourceType: "IMAGE",
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl,
      mediaId: media.id,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Avatar upload error"
    );
    return NextResponse.json(
      {
        error: "Failed to set avatar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
