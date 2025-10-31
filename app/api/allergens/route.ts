import { NextResponse } from "next/server";
import { getAllergens } from "@/lib/queries/metadata";

/**
 * GET /api/allergens
 * Get all allergens
 */
export async function GET() {
  try {
    const allergens = await getAllergens();
    return NextResponse.json(allergens);
  } catch (error) {
    console.error("Get allergens error:", error);
    return NextResponse.json(
      { error: "Failed to fetch allergens" },
      { status: 500 }
    );
  }
}
