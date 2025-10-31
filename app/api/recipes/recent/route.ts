import { NextResponse } from "next/server";
import { getRecentRecipes } from "@/lib/queries/recipes";

export async function GET() {
  try {
    const recentRecipes = await getRecentRecipes(3);
    return NextResponse.json({ recipes: recentRecipes });
  } catch (error) {
    console.error("Failed to fetch recent recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent recipes" },
      { status: 500 }
    );
  }
}
