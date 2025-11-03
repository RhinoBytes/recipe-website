import { NextRequest, NextResponse } from "next/server";
import { getUserRecipes } from "@/lib/queries/users";
import { log } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = (searchParams.get("sort") || "newest") as "newest" | "oldest" | "popular";

    const recipes = await getUserRecipes(userId, sort);
    log.info({ userId, sort, count: recipes.length }, "User recipes fetched successfully");
    return NextResponse.json({ recipes });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Error fetching user recipes"
    );
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
