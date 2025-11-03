import { NextResponse } from "next/server";
import { getCuisines } from "@/lib/queries/metadata";
import { log } from "@/lib/logger";

/**
 * GET /api/cuisines
 * Get all cuisines with recipe counts
 */
export async function GET() {
  try {
    const cuisines = await getCuisines();

    const formattedCuisines = cuisines.map((cuisine) => ({
      id: cuisine.id,
      name: cuisine.name,
      count: cuisine._count.recipes,
    }));

    log.info({ count: formattedCuisines.length }, "Fetched cuisines successfully");

    return NextResponse.json(formattedCuisines);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Get cuisines error"
    );
    return NextResponse.json(
      { error: "Failed to fetch cuisines" },
      { status: 500 }
    );
  }
}
