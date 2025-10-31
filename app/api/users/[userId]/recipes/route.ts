import { NextRequest, NextResponse } from "next/server";
import { getUserRecipes } from "@/lib/queries/users";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const sort = (searchParams.get("sort") || "newest") as "newest" | "oldest" | "popular";

    const recipes = await getUserRecipes(userId, sort);
    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}
