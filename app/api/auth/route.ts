import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // User not in database despite having valid token
      return NextResponse.json({ authenticated: false });
    }

    // Return user data with authenticated: true
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    // For auth checks, better to return authenticated: false than an error
    return NextResponse.json({ authenticated: false });
  }
}
