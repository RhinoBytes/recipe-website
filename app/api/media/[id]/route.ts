import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

/**
 * DELETE /api/media/[id]
 * Delete media from Cloudinary and database
 * Requires authentication and ownership
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const mediaId = params.id;

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
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check authorization
    // User can delete if they are the uploader or recipe owner (or admin)
    const isUploader = media.userId === currentUser.id;
    const isRecipeOwner = media.recipe && media.recipe.authorId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isUploader && !isRecipeOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: You cannot delete this media" },
        { status: 403 }
      );
    }

    // Delete from Cloudinary first
    try {
      const resourceType = media.resourceType.toLowerCase() as "image" | "video";
      await deleteCloudinaryAsset(media.publicId, resourceType);
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion failed:", cloudinaryError);
      return NextResponse.json(
        {
          error: "Failed to delete media from Cloudinary",
          details: cloudinaryError instanceof Error ? cloudinaryError.message : "Unknown error",
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
      // Log error for manual cleanup - Cloudinary asset is already deleted
      console.error("Database deletion failed after Cloudinary deletion:", {
        mediaId,
        publicId: media.publicId,
        error: dbError,
      });
      return NextResponse.json(
        {
          error: "Media deleted from Cloudinary but failed to delete from database. Please contact support.",
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
    console.error("Media deletion error:", error);
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
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const mediaId = params.id;
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
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwner = media.userId === currentUser.id;
    const isRecipeOwner = media.recipe && media.recipe.authorId === currentUser.id;
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
    console.error("Media update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
