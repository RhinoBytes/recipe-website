import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaResourceType } from "@prisma/client";

/**
 * POST /api/media
 * Persist Media record after successful Cloudinary upload
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse Cloudinary upload response from request body
    const body = await request.json();
    const {
      public_id,
      secure_url,
      url,
      bytes,
      width,
      height,
      format,
      resource_type,
      original_filename,
      folder,
      recipeId,
      altText,
      isPrimary,
      isProfileAvatar,
    } = body;

    // Validate required fields
    if (!public_id || !secure_url || !bytes) {
      return NextResponse.json(
        { error: "Missing required fields from Cloudinary response" },
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

    // Determine MIME type from format
    const mimeType = format ? `image/${format}` : "image/jpeg";

    // Map resource_type to enum
    let resourceType: MediaResourceType = MediaResourceType.IMAGE;
    if (resource_type === "video") {
      resourceType = MediaResourceType.VIDEO;
    }

    // Create Media record
    const media = await prisma.media.create({
      data: {
        publicId: public_id,
        url: url || secure_url,
        secureUrl: secure_url,
        mimeType,
        size: bytes,
        width: width || null,
        height: height || null,
        originalFilename: original_filename || null,
        folder: folder || null,
        altText: altText || null,
        resourceType,
        userId: currentUser.userId,
        recipeId: recipeId || null,
        isPrimary: isPrimary || false,
        isProfileAvatar: isProfileAvatar || false,
      },
    });

    return NextResponse.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Media creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create media record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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
    console.error("Media fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
