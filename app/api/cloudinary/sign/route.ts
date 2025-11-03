import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createUploadSignature,
  validateCloudinaryConfig,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cloudinary/sign
 * Generate a signed upload signature for Cloudinary
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    // Validate Cloudinary configuration
    validateCloudinaryConfig();

    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recipeId, folder } = body;

    // If recipeId is provided, verify ownership
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

    // Generate signature
    const signatureData = createUploadSignature(folder, recipeId);

    return NextResponse.json({
      success: true,
      signature: signatureData.signature,
      timestamp: signatureData.timestamp,
      apiKey: signatureData.apiKey,
      cloudName: signatureData.cloudName,
      folder: signatureData.folder,
      uploadPreset: signatureData.uploadPreset,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate upload signature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
