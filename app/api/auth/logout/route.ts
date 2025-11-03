import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function POST() {
  try {
    await removeAuthCookie();
    log.info({}, "User logged out successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Logout error"
    );
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
