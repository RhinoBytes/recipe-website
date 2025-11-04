import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput, isValidEmail } from "@/utils/validation";
import { log } from "@/lib/logger";

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * 
 * @param request - NextRequest containing email/username and password in body
 * @returns NextResponse with user data or error
 * 
 * @example
 * POST /api/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email, password } = body;

    // Sanitize email input (could be username or email)
    email = sanitizeInput(email || "");
    password = password || "";

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: isValidEmail(email)
        ? { email }
        : { username: email },
    });

    if (!user) {
      log.warn({ emailOrUsername: email }, "Failed login attempt - user not found");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      log.warn({ email, userId: user.id }, "Failed login attempt - invalid password");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    log.info({ userId: user.id, email: user.email, username: user.username }, "User logged in successfully");

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Login error"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
