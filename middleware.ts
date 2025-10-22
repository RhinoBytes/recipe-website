// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which routes should be protected
const PROTECTED_ROUTES = ["/new-recipe", "/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    // Check for auth cookie
    const authCookie = request.cookies.get("auth-token");

    // If no auth cookie found, redirect to login
    if (!authCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
