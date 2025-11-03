import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

/**
 * GET /api/auth
 * Get current authenticated user
 * 
 * @returns NextResponse with authenticated status and user data
 * 
 * @example
 * GET /api/auth
 * Response: { authenticated: true, user: {...} }
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      // Return 200 OK with authenticated: false
      return NextResponse.json({ authenticated: false });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        createdAt: true,
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

    if (!user) {
      // User not in database despite having valid token
      log.warn({ userId: currentUser.userId }, "Valid token but user not found in database");
      return NextResponse.json({ authenticated: false });
    }

    // Extract avatar URL from media
    const avatarMedia = user.media[0];
    const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

    // Return user data with authenticated: true
    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        avatarUrl,
      },
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Get current user error"
    );
    // For auth checks, better to return authenticated: false than an error
    return NextResponse.json({ authenticated: false });
  }
}
