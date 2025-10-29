import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput, isValidEmail } from "@/utils/validation";
import { getRandomProfileAvatar } from "@/lib/placeholders";

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * @param request - NextRequest containing email and password in body
 * @returns NextResponse with user data or error
 * 
 * @example
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password } = body;

    // Sanitize inputs
    email = sanitizeInput(email || "");
    password = password || "";

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    // Generate a temporary username from email
    const tempUsername = email.split("@")[0] + "_" + Date.now();

    // Assign a random avatar
    const avatarUrl = getRandomProfileAvatar();

    const user = await prisma.user.create({
      data: {
        username: tempUsername,
        email,
        passwordHash,
        avatarUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
