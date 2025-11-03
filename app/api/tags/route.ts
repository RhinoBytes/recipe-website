import { NextResponse } from "next/server";
import { getTags } from "@/lib/queries/metadata";
import { log } from "@/lib/logger";

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

    log.info({ count: formattedTags.length }, "Fetched tags successfully");

    return NextResponse.json(formattedTags);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Get tags error"
    );
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
