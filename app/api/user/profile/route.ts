import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/utils/validation";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

/**
 * PATCH /api/user/profile
 * Update user profile (username and bio)
 * 
 * NOTE: Avatar management should be done via the Media API:
 * - POST /api/media with isProfileAvatar: true
 * - DELETE /api/media/[id] to remove avatar
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, bio } = body;

    const updateData: { username?: string; bio?: string } = {};

    // Note: avatarUrl is deprecated - use Media API for avatar management

    if (bio !== undefined) {
      const sanitizedBio = sanitizeInput(bio);
      updateData.bio = sanitizedBio;
    }

    if (username !== undefined) {
      const sanitizedUsername = sanitizeInput(username);
      
      // Validate the sanitized username
      if (!sanitizedUsername || sanitizedUsername.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters" },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { username: sanitizedUsername },
      });

      if (existingUser && existingUser.id !== currentUser.userId) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }

      updateData.username = sanitizedUsername;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        role: true,
        createdAt: true,
        media: {
          where: { isProfileAvatar: true },
          select: {
            url: true,
            secureUrl: true,
          },
          take: 1,
        },
      },
    });

    // Extract avatar URL
    const avatarMedia = updatedUser.media[0];
    const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        avatarUrl,
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Profile update error"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
