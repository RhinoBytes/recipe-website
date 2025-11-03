import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      log.warn({}, "Unauthorized username update attempt");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== currentUser.userId) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        updatedAt: true,
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

    log.info({ userId: currentUser.userId, username }, "Username updated successfully");

    return NextResponse.json({
      message: "Username updated successfully",
      user: {
        ...updatedUser,
        avatarUrl,
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Update username error"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
