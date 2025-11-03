import { NextResponse } from "next/server";
import { getRecentRecipes } from "@/lib/queries/recipes";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const recentRecipes = await getRecentRecipes(3);
    log.info({ count: recentRecipes.length }, "Fetched recent recipes successfully");
    return NextResponse.json({ recipes: recentRecipes });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Failed to fetch recent recipes"
    );
    return NextResponse.json(
      { error: "Failed to fetch recent recipes" },
      { status: 500 }
    );
  }
}
