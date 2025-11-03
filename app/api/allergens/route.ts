import { NextResponse } from "next/server";
import { getAllergens } from "@/lib/queries/metadata";
import { log } from "@/lib/logger";

/**
 * GET /api/allergens
 * Get all allergens
 */
export async function GET() {
  try {
    const allergens = await getAllergens();
    log.info({ count: allergens.length }, "Fetched allergens successfully");
    return NextResponse.json(allergens);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Get allergens error"
    );
    return NextResponse.json(
      { error: "Failed to fetch allergens" },
      { status: 500 }
    );
  }
}
