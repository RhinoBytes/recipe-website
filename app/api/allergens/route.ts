import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/allergens
 * Get all allergens
 */
export async function GET() {
  try {
    const allergens = await prisma.allergen.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(allergens);
  } catch (error) {
    console.error("Get allergens error:", error);
    return NextResponse.json(
      { error: "Failed to fetch allergens" },
      { status: 500 }
    );
  }
}
