import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/utils/validation";

/**
 * PATCH /api/user/profile
 * Update user profile (avatar and username)
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
    const { avatarUrl, username } = body;

    const updateData: { avatarUrl?: string; username?: string } = {};

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
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
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
