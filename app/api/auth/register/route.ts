import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput, isValidEmail, isValidPassword, isValidUsername } from "@/utils/validation";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import { log } from "@/lib/logger";

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * @param request - NextRequest containing email, password, and username in body
 * @returns NextResponse with user data or error
 * 
 * @example
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123",
 *   "username": "johndoe"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password, username } = body;

    // Sanitize inputs
    email = sanitizeInput(email || "");
    password = password || "";
    username = sanitizeInput(username || "");

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and include uppercase, lowercase, and a number" },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters and can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      log.warn({ email }, "Registration attempt with existing email");
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check if username is already taken
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      log.warn({ username }, "Registration attempt with existing username");
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    // Create user without avatar - they can add one via profile later
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
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

    // Extract avatar URL (will be default if no media)
    const avatarMedia = user.media[0];
    const avatarUrl = avatarMedia?.secureUrl || avatarMedia?.url || DEFAULT_USER_AVATAR;

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    await setAuthCookie(token);

    log.info({ userId: user.id, email: user.email, username: user.username }, "User registered successfully");

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          ...user,
          avatarUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Registration error"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
