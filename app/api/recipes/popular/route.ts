import { NextResponse } from "next/server";
import { getPopularRecipes } from "@/lib/queries/recipes";

export async function GET() {
  try {
    const popularRecipes = await getPopularRecipes(3);
    return NextResponse.json({ recipes: popularRecipes });
  } catch (error) {
    console.error("Failed to fetch popular recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular recipes" },
      { status: 500 }
    );
  }
}
