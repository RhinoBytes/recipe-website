import { NextResponse } from "next/server";
import { getPopularRecipes } from "@/lib/queries/recipes";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const popularRecipes = await getPopularRecipes(3);
    log.info({ count: popularRecipes.length }, "Fetched popular recipes successfully");
    return NextResponse.json({ recipes: popularRecipes });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Failed to fetch popular recipes"
    );
    return NextResponse.json(
      { error: "Failed to fetch popular recipes" },
      { status: 500 }
    );
  }
}
