import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { MediaResourceType } from "@prisma/client";

/**
 * POST /api/media/upload
 * Upload file to Supabase Storage and create Media record
 * Uses server-side Supabase Admin client (bypasses RLS)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const recipeId = formData.get("recipeId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(
            1
          )}MB (max 10MB)`,
        },
        { status: 400 }
      );
    }

    // If recipeId provided, verify ownership
    if (recipeId) {
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { authorId: true },
      });

      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found" },
          { status: 404 }
        );
      }

      if (recipe.authorId !== currentUser.userId) {
        return NextResponse.json(
          { error: "Unauthorized: You are not the owner of this recipe" },
          { status: 403 }
        );
      }
    }

    // Generate unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = recipeId
      ? `recipes/${recipeId}/${fileName}`
      : `uploads/${fileName}`;

    log.info(
      {
        fileName: file.name,
        fileSize: file.size,
        filePath,
        userId: currentUser.userId,
      },
      "Starting server-side upload"
    );

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using ADMIN client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("recipe-builder")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      log.error({ error: uploadError }, "Supabase upload failed");
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload to storage" },
        { status: 500 }
      );
    }

    if (!uploadData) {
      return NextResponse.json(
        { error: "No upload data returned from Supabase" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("recipe-builder")
      .getPublicUrl(uploadData.path);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to get public URL" },
        { status: 500 }
      );
    }

    // Determine MIME type
    const mimeType = file.type || `image/${fileExt}`;

    // Map resource type to enum
    const resourceType = file.type.startsWith("video/")
      ? MediaResourceType.VIDEO
      : MediaResourceType.IMAGE;

    // Create Media record in database
    const media = await prisma.media.create({
      data: {
        publicId: uploadData.path,
        url: urlData.publicUrl,
        secureUrl: urlData.publicUrl,
        mimeType,
        size: file.size,
        originalFilename: file.name,
        folder: uploadData.path.split("/").slice(0, -1).join("/") || null,
        resourceType,
        userId: currentUser.userId,
        recipeId: recipeId || null,
        isPrimary: false,
        isProfileAvatar: false,
      },
    });

    log.info(
      {
        mediaId: media.id,
        userId: currentUser.userId,
      },
      "Media uploaded and saved successfully"
    );

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      },
      "Media upload error"
    );

    return NextResponse.json(
      {
        error: "Failed to upload media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * GET /api/media?recipeId=xxx
 * List media records for a recipe
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json(
        { error: "recipeId query parameter is required" },
        { status: 400 }
      );
    }

    // Get media for recipe
    const media = await prisma.media.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    log.error(
      {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
      },
      "Media fetch error"
    );
    return NextResponse.json(
      {
        error: "Failed to fetch media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
