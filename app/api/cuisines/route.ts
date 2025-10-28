import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cuisines
 * Get all cuisines with recipe counts
 */
export async function GET() {
  try {
    const cuisines = await prisma.cuisine.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: {
        recipes: {
          _count: "desc",
        },
      },
    });

    const formattedCuisines = cuisines.map((cuisine) => ({
      id: cuisine.id,
      name: cuisine.name,
      count: cuisine._count.recipes,
    }));

    return NextResponse.json(formattedCuisines);
  } catch (error) {
    console.error("Get cuisines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cuisines" },
      { status: 500 }
    );
  }
}
