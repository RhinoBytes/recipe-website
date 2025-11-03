import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/queries/users";
import { log } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const user = await getUserById(userId);

    if (!user) {
      log.warn({ userId }, "User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    log.info({ userId }, "User fetched successfully");
    return NextResponse.json({ user });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Error fetching user"
    );
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
