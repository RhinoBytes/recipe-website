import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/server";
import { log } from "@/lib/logger";

// Define the correct context type based on the error message
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * DELETE /api/media/[id]
 * Delete media from Cloudinary and database
 * Requires authentication and ownership
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // Await the params promise to resolve
    const { id: mediaId } = await params;

    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find media record
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        recipe: {
          select: {
            id: true,
            authorId: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check authorization
    const isUploader = media.userId === currentUser.userId;
    const isRecipeOwner =
      media.recipe && media.recipe.authorId === currentUser.userId;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isUploader && !isRecipeOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: You cannot delete this media" },
        { status: 403 }
      );
    }

    // Delete from Supabase Storage first
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from("recipe-builder")
        .remove([media.publicId]);

      if (storageError) {
        throw storageError;
      }
    } catch (storageError) {
      log.error({ error: storageError }, "Supabase Storage deletion failed");
      return NextResponse.json(
        {
          error: "Failed to delete media from storage",
          details:
            storageError instanceof Error
              ? storageError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Delete from database
    try {
      await prisma.media.delete({
        where: { id: mediaId },
      });
    } catch (dbError) {
      // Log error for manual cleanup - Storage asset is already deleted
      log.error({
        mediaId,
        storagePath: media.publicId,
        error: dbError,
      });
      return NextResponse.json(
        {
          error:
            "Media deleted from storage but failed to delete from database. Please contact support.",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Media deletion error");
    return NextResponse.json(
      {
        error: "Failed to delete media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/media/[id]
 * Update media metadata (isPrimary, isProfileAvatar, altText, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    // Await the params promise to resolve
    const { id: mediaId } = await params;

    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isPrimary, isProfileAvatar, altText, caption } = body;

    // Find media record
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        recipe: {
          select: {
            id: true,
            authorId: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check authorization
    const isOwner = media.userId === currentUser.userId;
    const isRecipeOwner =
      media.recipe && media.recipe.authorId === currentUser.userId;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isRecipeOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: You cannot update this media" },
        { status: 403 }
      );
    }

    // If setting isPrimary=true, unset other primary media for the same recipe
    if (isPrimary === true && media.recipeId) {
      await prisma.media.updateMany({
        where: {
          recipeId: media.recipeId,
          id: { not: mediaId },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // If setting isProfileAvatar=true, unset other profile avatars for the same user
    if (isProfileAvatar === true) {
      await prisma.media.updateMany({
        where: {
          userId: media.userId,
          id: { not: mediaId },
        },
        data: {
          isProfileAvatar: false,
        },
      });
    }

    // Update media
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...(typeof isPrimary === "boolean" && { isPrimary }),
        ...(typeof isProfileAvatar === "boolean" && { isProfileAvatar }),
        ...(altText !== undefined && { altText }),
        ...(caption !== undefined && { caption }),
      },
    });

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error) {
    log.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) }, "Media update error");
    return NextResponse.json(
      {
        error: "Failed to update media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
