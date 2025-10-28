import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    
    // Get top-level categories with recipe counts
    const categories = await prisma.category.findMany({
      where: {
        parentId: null, // Top-level categories only
      },
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
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    // Format categories for the UI
    const formattedCategories = categories.map((category) => {
      // Convert category name to slug
      const slug = category.name.toLowerCase().replace(/\s+/g, "-");

      return {
        id: category.id,
        name: category.name,
        slug: slug,
        count: category._count.recipes,
        image: `/images/categories/${slug}.jpg`, // Assuming you have these images
      };
    });

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
