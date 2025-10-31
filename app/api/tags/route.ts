import { NextResponse } from "next/server";
import { getTags } from "@/lib/queries/metadata";

/**
 * GET /api/tags
 * Get all tags with recipe counts
 */
export async function GET() {
  try {
    const tags = await getTags();

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.recipes,
    }));

    return NextResponse.json(formattedTags);
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
